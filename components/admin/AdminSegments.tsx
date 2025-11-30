import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getSegments,
  grantCreditsToUsers,
  generateEmailTemplate,
  exportUsersToCSV,
  Segment,
  SegmentType,
  AdminUser,
} from '../../services/adminService';

const AdminSegments: React.FC = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState(5);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailContent, setEmailContent] = useState<{ subject: string; body: string; emails: string[] } | null>(null);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const data = await getSegments();
      setSegments(data);
    } catch (err) {
      console.error('Error loading segments:', err);
      setError('Fehler beim Laden der Segmente');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (segment: Segment) => {
    const csv = exportUsersToCSV(segment.users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment-${segment.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenEmailModal = (segment: Segment, templateType: 'upsell' | 'reactivation' | 'appreciation' | 'custom') => {
    const content = generateEmailTemplate(segment, templateType);
    setEmailContent(content);
    setSelectedSegment(segment);
    setShowEmailModal(true);
  };

  const handleSendEmail = () => {
    if (!emailContent) return;

    // Create mailto link with BCC for all recipients
    const bcc = emailContent.emails.join(',');
    const subject = encodeURIComponent(emailContent.subject);
    const body = encodeURIComponent(emailContent.body);

    // Note: mailto has limits, so for many recipients, use external tool
    if (emailContent.emails.length > 20) {
      // Copy emails to clipboard for external tool
      navigator.clipboard.writeText(emailContent.emails.join('\n'));
      alert(`${emailContent.emails.length} Email-Adressen wurden in die Zwischenablage kopiert.\n\nBitte nutzen Sie ein externes Email-Tool für den Versand.`);
    } else {
      window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    }

    setShowEmailModal(false);
  };

  const handleOpenCreditsModal = (segment: Segment) => {
    setSelectedSegment(segment);
    setCreditsAmount(5);
    setShowCreditsModal(true);
  };

  const handleGrantCredits = async () => {
    if (!selectedSegment) return;

    if (!confirm(`Wirklich ${creditsAmount} Credits an ${selectedSegment.users.length} User vergeben?`)) return;

    try {
      setActionLoading(true);
      const userIds = selectedSegment.users.map((u) => u.uid);
      await grantCreditsToUsers(userIds, creditsAmount);
      alert(`${creditsAmount} Credits wurden an ${selectedSegment.users.length} User vergeben!`);
      setShowCreditsModal(false);
      loadSegments(); // Refresh
    } catch (err) {
      console.error('Error granting credits:', err);
      setError('Fehler beim Vergeben der Credits');
    } finally {
      setActionLoading(false);
    }
  };

  const getEmailTemplateOptions = (segmentId: SegmentType): { type: 'upsell' | 'reactivation' | 'appreciation' | 'custom'; label: string }[] => {
    switch (segmentId) {
      case 'upsell_candidates':
        return [
          { type: 'upsell', label: 'Upgrade-Angebot' },
          { type: 'custom', label: 'Eigene Nachricht' },
        ];
      case 'inactive':
        return [
          { type: 'reactivation', label: 'Reaktivierung' },
          { type: 'custom', label: 'Eigene Nachricht' },
        ];
      case 'power_users':
        return [
          { type: 'appreciation', label: 'Dankes-Nachricht' },
          { type: 'custom', label: 'Eigene Nachricht' },
        ];
      default:
        return [{ type: 'custom', label: 'Eigene Nachricht' }];
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing-Segmente</h1>
          <p className="text-gray-600 mt-1">Zielgruppen für gezielte Aktionen</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Segment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div key={segment.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{segment.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                      <p className="text-sm text-gray-500">{segment.description}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-4xl font-bold text-[#532418]">{segment.users.length}</p>
                  <p className="text-sm text-gray-500">User</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Email Templates */}
                  <div className="flex flex-wrap gap-2">
                    {getEmailTemplateOptions(segment.id).map((option) => (
                      <button
                        key={option.type}
                        onClick={() => handleOpenEmailModal(segment, option.type)}
                        disabled={segment.users.length === 0}
                        className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✉️ {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenCreditsModal(segment)}
                      disabled={segment.users.length === 0}
                      className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🎁 Credits schenken
                    </button>
                    <button
                      onClick={() => handleExportCSV(segment)}
                      disabled={segment.users.length === 0}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      📥 CSV Export
                    </button>
                  </div>
                </div>
              </div>

              {/* User Preview */}
              {segment.users.length > 0 && (
                <div className="border-t bg-gray-50 px-6 py-3">
                  <p className="text-xs text-gray-500 mb-2">Beispiel-User:</p>
                  <div className="space-y-1">
                    {segment.users.slice(0, 3).map((user) => (
                      <p key={user.uid} className="text-sm text-gray-700 truncate">
                        {user.email}
                      </p>
                    ))}
                    {segment.users.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{segment.users.length - 3} weitere
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Email Modal */}
        {showEmailModal && emailContent && selectedSegment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Email an {selectedSegment.name} ({emailContent.emails.length} Empfänger)
                  </h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                    <input
                      type="text"
                      value={emailContent.subject}
                      onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C8956C]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                    <textarea
                      value={emailContent.body}
                      onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C8956C] font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empfänger ({emailContent.emails.length})
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-600 font-mono">
                        {emailContent.emails.slice(0, 10).join(', ')}
                        {emailContent.emails.length > 10 && ` ... +${emailContent.emails.length - 10} weitere`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(emailContent.emails.join('\n'));
                      alert('Email-Adressen kopiert!');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Emails kopieren
                  </button>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="px-4 py-2 text-white bg-[#532418] rounded-lg hover:bg-[#67534F]"
                  >
                    {emailContent.emails.length > 20 ? 'Emails kopieren & schließen' : 'Email öffnen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credits Modal */}
        {showCreditsModal && selectedSegment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Credits schenken</h3>
                  <button onClick={() => setShowCreditsModal(false)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>

                <p className="text-gray-600 mb-4">
                  Credits an <strong>{selectedSegment.users.length} User</strong> im Segment "{selectedSegment.name}" vergeben:
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anzahl Credits</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={creditsAmount}
                      onChange={(e) => setCreditsAmount(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={creditsAmount}
                      onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Gesamt:</strong> {creditsAmount * selectedSegment.users.length} Credits werden vergeben
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreditsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleGrantCredits}
                    disabled={actionLoading}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Wird vergeben...' : `${creditsAmount} Credits vergeben`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSegments;
