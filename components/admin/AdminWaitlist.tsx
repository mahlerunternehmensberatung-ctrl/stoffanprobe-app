import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { getWaitlist, WaitlistEntry } from '../../services/adminService';

const AdminWaitlist: React.FC = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadWaitlist = async () => {
      try {
        setLoading(true);
        const data = await getWaitlist();
        setEntries(data);
      } catch (err) {
        console.error('Error loading waitlist:', err);
        setError('Fehler beim Laden der Waitlist');
      } finally {
        setLoading(false);
      }
    };

    loadWaitlist();
  }, []);

  const handleCopyAllEmails = () => {
    const emails = entries.map((e) => e.email).join('\n');
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = [
      'Email,Datum',
      ...entries.map((e) => `${e.email},${e.createdAt.toLocaleDateString('de-DE')}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stoffberater-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stoffberater Pro Waitlist</h1>
            <p className="text-gray-600 mt-1">
              {entries.length} Interessenten für den Launch
            </p>
          </div>

          {entries.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyAllEmails}
                className="px-4 py-2 bg-[#532418] text-white rounded-lg hover:bg-[#67534F] transition-colors flex items-center gap-2"
              >
                {copied ? '✓ Kopiert!' : '📋 Alle Emails kopieren'}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                📥 CSV Export
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl block mb-4">📋</span>
            <h3 className="text-lg font-medium text-gray-900">Noch keine Einträge</h3>
            <p className="text-gray-500 mt-2">
              Sobald User sich für den Stoffberater Pro interessieren, erscheinen sie hier.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.createdAt.toLocaleDateString('de-DE')}{' '}
                        {entry.createdAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <div key={entry.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-sm mr-2">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{entry.email}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {entry.createdAt.toLocaleDateString('de-DE')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {entries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Zusammenfassung</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-[#532418]">{entries.length}</p>
                <p className="text-sm text-gray-500">Gesamt</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-[#532418]">
                  {entries.filter((e) => {
                    const today = new Date();
                    const entryDate = e.createdAt;
                    return (
                      entryDate.getDate() === today.getDate() &&
                      entryDate.getMonth() === today.getMonth() &&
                      entryDate.getFullYear() === today.getFullYear()
                    );
                  }).length}
                </p>
                <p className="text-sm text-gray-500">Heute</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-[#532418]">
                  {entries.filter((e) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return e.createdAt >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-500">Diese Woche</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWaitlist;
