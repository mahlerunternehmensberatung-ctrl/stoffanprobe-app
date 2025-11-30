import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import {
  getAllLeads,
  getLeadStats,
  updateLeadStatus,
  updateLeadNotizen,
  importLeadsFromCSV,
  parseCSV,
  searchLeads,
  Lead,
  LeadStatus,
  LeadStats,
} from '../../services/leadService';

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-blue-100 text-blue-800' },
  { value: 'kontaktiert', label: 'Kontaktiert', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interessiert', label: 'Interessiert', color: 'bg-purple-100 text-purple-800' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'nicht_interessiert', label: 'Nicht interessiert', color: 'bg-gray-100 text-gray-800' },
];

const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [stadtFilter, setStadtFilter] = useState('');
  const [editingNotizen, setEditingNotizen] = useState<string | null>(null);
  const [notizenValue, setNotizenValue] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, statsData] = await Promise.all([
        searchLeads(searchQuery, statusFilter, stadtFilter),
        getLeadStats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Fehler beim Laden der Leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, statusFilter, stadtFilter]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      // Refresh stats
      const newStats = await getLeadStats();
      setStats(newStats);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Fehler beim Aktualisieren des Status');
    }
  };

  const handleSaveNotizen = async (leadId: string) => {
    try {
      await updateLeadNotizen(leadId, notizenValue);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, notizen: notizenValue } : l))
      );
      setEditingNotizen(null);
    } catch (err) {
      console.error('Error saving notizen:', err);
      setError('Fehler beim Speichern der Notizen');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);

      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError('Keine gültigen Daten in der CSV-Datei gefunden');
        return;
      }

      const result = await importLeadsFromCSV(rows);
      setImportResult({ imported: result.imported, skipped: result.skipped });

      if (result.duplicates.length > 0 && result.duplicates.length <= 5) {
        setError(`Übersprungen (Duplikate): ${result.duplicates.join(', ')}`);
      }

      // Refresh data
      await loadData();
    } catch (err) {
      console.error('Error importing CSV:', err);
      setError('Fehler beim Importieren der CSV-Datei');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${option?.color || 'bg-gray-100'}`}>
        {option?.label || status}
      </span>
    );
  };

  // Get unique cities for filter
  const uniqueCities = [...new Set(leads.map((l) => l.stadt).filter(Boolean))].sort();

  if (loading && leads.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#532418]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead-Management</h1>
            <p className="text-gray-600 mt-1">{leads.length} Leads gefunden</p>
          </div>

          {/* Import Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-4 py-2 bg-[#532418] text-white rounded-lg hover:bg-[#67534F] disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Importiere...
                </>
              ) : (
                <>
                  📥 Leads importieren (CSV)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex justify-between items-center">
            <span>
              ✓ {importResult.imported} Leads importiert
              {importResult.skipped > 0 && `, ${importResult.skipped} übersprungen (Duplikate)`}
            </span>
            <button onClick={() => setImportResult(null)} className="font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Gesamt</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.neu}</p>
              <p className="text-xs text-gray-500">Neu</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.kontaktiert}</p>
              <p className="text-xs text-gray-500">Kontaktiert</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.interessiert}</p>
              <p className="text-xs text-gray-500">Interessiert</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
              <p className="text-xs text-gray-500">Converted</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.nicht_interessiert}</p>
              <p className="text-xs text-gray-500">Nicht int.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center border-2 border-green-200">
              <p className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Conv. Rate</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Firma, Email, Stadt..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8956C] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8956C]"
          >
            <option value="all">Alle Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Stadt Filter */}
          <select
            value={stadtFilter}
            onChange={(e) => setStadtFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8956C]"
          >
            <option value="">Alle Städte</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Leads Table */}
        {leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl block mb-4">📋</span>
            <h3 className="text-lg font-medium text-gray-900">Keine Leads gefunden</h3>
            <p className="text-gray-500 mt-2">
              Importieren Sie Leads per CSV oder passen Sie die Filter an.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stadt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notizen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{lead.firma || '-'}</p>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {lead.website}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{lead.email}</p>
                          {lead.telefon && (
                            <p className="text-sm text-gray-500">{lead.telefon}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.plz && <span className="text-gray-400">{lead.plz} </span>}
                        {lead.stadt || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`px-2 py-1 text-xs font-medium rounded border-0 cursor-pointer ${
                            STATUS_OPTIONS.find((o) => o.value === lead.status)?.color
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {lead.userId && (
                          <span className="ml-2 text-xs text-green-600" title="Registrierter User">
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {editingNotizen === lead.id ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={notizenValue}
                              onChange={(e) => setNotizenValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNotizen(lead.id);
                                if (e.key === 'Escape') setEditingNotizen(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveNotizen(lead.id)}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingNotizen(null)}
                              className="px-2 py-1 text-xs bg-gray-300 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotizen(lead.id);
                              setNotizenValue(lead.notizen);
                            }}
                            className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded truncate"
                            title={lead.notizen || 'Klicken zum Bearbeiten'}
                          >
                            {lead.notizen || <span className="text-gray-400 italic">+ Notiz</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.createdAt.toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{lead.firma || 'Ohne Firma'}</p>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      {lead.telefon && (
                        <p className="text-sm text-gray-500">{lead.telefon}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(lead.status)}
                      {lead.userId && (
                        <span className="text-xs text-green-600">✓ User</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>{lead.stadt || '-'}</span>
                    <span>•</span>
                    <span>{lead.createdAt.toLocaleDateString('de-DE')}</span>
                  </div>

                  <div className="mt-3">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    {editingNotizen === lead.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={notizenValue}
                          onChange={(e) => setNotizenValue(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          placeholder="Notizen..."
                        />
                        <button
                          onClick={() => handleSaveNotizen(lead.id)}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNotizen(lead.id);
                          setNotizenValue(lead.notizen);
                        }}
                        className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded"
                      >
                        {lead.notizen || <span className="text-gray-400 italic">+ Notiz hinzufügen</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSV Format Help */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">CSV-Import Format</h3>
          <p className="text-sm text-gray-600 mb-2">
            Die CSV-Datei sollte folgende Spalten enthalten (Reihenfolge egal):
          </p>
          <code className="text-xs bg-white px-2 py-1 rounded">
            Firma, Email, Telefon, Website, Stadt, PLZ
          </code>
          <p className="text-sm text-gray-500 mt-2">
            Duplikate werden automatisch anhand der Email-Adresse erkannt und übersprungen.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;
