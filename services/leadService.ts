import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type LeadStatus = 'neu' | 'kontaktiert' | 'interessiert' | 'converted' | 'nicht_interessiert';

export interface Lead {
  id: string;
  firma: string;
  email: string;
  telefon: string;
  website: string;
  stadt: string;
  plz: string;
  status: LeadStatus;
  notizen: string;
  userId: string | null; // Verknüpfung mit registriertem User
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadStats {
  total: number;
  neu: number;
  kontaktiert: number;
  interessiert: number;
  converted: number;
  nicht_interessiert: number;
  conversionRate: number;
}

export interface CSVLeadRow {
  firma?: string;
  email: string;
  telefon?: string;
  website?: string;
  stadt?: string;
  plz?: string;
}

const COLLECTION_NAME = 'leads';

// === Lead CRUD Operations ===

export const getAllLeads = async (): Promise<Lead[]> => {
  try {
    const leadsRef = collection(db, COLLECTION_NAME);
    const q = query(leadsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        firma: data.firma || '',
        email: data.email || '',
        telefon: data.telefon || '',
        website: data.website || '',
        stadt: data.stadt || '',
        plz: data.plz || '',
        status: data.status || 'neu',
        notizen: data.notizen || '',
        userId: data.userId || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    throw error;
  }
};

export const getLeadStats = async (): Promise<LeadStats> => {
  try {
    const leads = await getAllLeads();
    const total = leads.length;
    const neu = leads.filter((l) => l.status === 'neu').length;
    const kontaktiert = leads.filter((l) => l.status === 'kontaktiert').length;
    const interessiert = leads.filter((l) => l.status === 'interessiert').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const nicht_interessiert = leads.filter((l) => l.status === 'nicht_interessiert').length;

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      neu,
      kontaktiert,
      interessiert,
      converted,
      nicht_interessiert,
      conversionRate,
    };
  } catch (error) {
    console.error('Error getting lead stats:', error);
    throw error;
  }
};

export const updateLeadStatus = async (leadId: string, status: LeadStatus): Promise<void> => {
  try {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

export const updateLeadNotizen = async (leadId: string, notizen: string): Promise<void> => {
  try {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadRef, {
      notizen,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating lead notizen:', error);
    throw error;
  }
};

// === CSV Import ===

export const importLeadsFromCSV = async (
  rows: CSVLeadRow[]
): Promise<{ imported: number; skipped: number; duplicates: string[] }> => {
  try {
    // Get existing leads to check for duplicates
    const existingLeads = await getAllLeads();
    const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()));

    const duplicates: string[] = [];
    const toImport: CSVLeadRow[] = [];

    for (const row of rows) {
      if (!row.email) continue;

      const emailLower = row.email.toLowerCase().trim();
      if (existingEmails.has(emailLower)) {
        duplicates.push(emailLower);
      } else {
        toImport.push(row);
        existingEmails.add(emailLower); // Prevent duplicates within import
      }
    }

    // Batch import (Firestore allows max 500 per batch)
    const batchSize = 500;
    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = toImport.slice(i, i + batchSize);

      for (const row of chunk) {
        const leadRef = doc(collection(db, COLLECTION_NAME));
        batch.set(leadRef, {
          firma: row.firma?.trim() || '',
          email: row.email.toLowerCase().trim(),
          telefon: row.telefon?.trim() || '',
          website: row.website?.trim() || '',
          stadt: row.stadt?.trim() || '',
          plz: row.plz?.trim() || '',
          status: 'neu' as LeadStatus,
          notizen: '',
          userId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }

    return {
      imported: toImport.length,
      skipped: duplicates.length,
      duplicates,
    };
  } catch (error) {
    console.error('Error importing leads:', error);
    throw error;
  }
};

// === Auto-Matching ===

/**
 * Prüft ob eine Email in Leads existiert und markiert als converted
 * Wird bei User-Registrierung aufgerufen
 */
export const matchLeadByEmail = async (email: string, userId: string): Promise<boolean> => {
  try {
    const leadsRef = collection(db, COLLECTION_NAME);
    const q = query(leadsRef, where('email', '==', email.toLowerCase().trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return false;
    }

    // Update first matching lead
    const leadDoc = snapshot.docs[0];
    await updateDoc(doc(db, COLLECTION_NAME, leadDoc.id), {
      status: 'converted' as LeadStatus,
      userId,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error matching lead:', error);
    return false;
  }
};

// === Search and Filter ===

export const searchLeads = async (
  searchQuery: string,
  statusFilter?: LeadStatus | 'all',
  stadtFilter?: string
): Promise<Lead[]> => {
  const allLeads = await getAllLeads();
  const query = searchQuery.toLowerCase();

  return allLeads.filter((lead) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      lead.firma.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.stadt.toLowerCase().includes(query) ||
      lead.telefon.includes(query);

    // Status filter
    const matchesStatus = !statusFilter || statusFilter === 'all' || lead.status === statusFilter;

    // Stadt filter
    const matchesStadt = !stadtFilter || lead.stadt.toLowerCase().includes(stadtFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesStadt;
  });
};

// === CSV Parsing Helper ===

export const parseCSV = (csvText: string): CSVLeadRow[] => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  // Find column indices
  const columnMap: Record<string, number> = {};
  const possibleMappings: Record<string, string[]> = {
    firma: ['firma', 'company', 'unternehmen', 'firmenname', 'name'],
    email: ['email', 'e-mail', 'mail', 'emailaddress'],
    telefon: ['telefon', 'phone', 'tel', 'telephone', 'telefonnummer'],
    website: ['website', 'web', 'url', 'homepage', 'webseite'],
    stadt: ['stadt', 'city', 'ort'],
    plz: ['plz', 'zip', 'postleitzahl', 'postal'],
  };

  for (const [field, aliases] of Object.entries(possibleMappings)) {
    const index = headers.findIndex((h) => aliases.some((a) => h.includes(a)));
    if (index !== -1) {
      columnMap[field] = index;
    }
  }

  // Parse rows
  const rows: CSVLeadRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: CSVLeadRow = {
      firma: columnMap.firma !== undefined ? values[columnMap.firma] || '' : '',
      email: columnMap.email !== undefined ? values[columnMap.email] || '' : '',
      telefon: columnMap.telefon !== undefined ? values[columnMap.telefon] || '' : '',
      website: columnMap.website !== undefined ? values[columnMap.website] || '' : '',
      stadt: columnMap.stadt !== undefined ? values[columnMap.stadt] || '' : '',
      plz: columnMap.plz !== undefined ? values[columnMap.plz] || '' : '',
    };

    // Only add if email exists
    if (row.email && row.email.includes('@')) {
      rows.push(row);
    }
  }

  return rows;
};

// Helper to parse CSV line (handles quoted values)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};
