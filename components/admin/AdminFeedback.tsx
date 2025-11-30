import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getAllFeedback,
  markFeedbackValuable,
  blockUser,
  unblockUser,
  FeedbackEntry,
} from '../../services/adminService';

type FilterType = 'all' | 'valuable' | 'not_valuable' | 'unreviewed';

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedbacks(data);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Fehler beim Laden des Feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleMarkValuable = async (feedbackId: string, isValuable: boolean) => {
    try {
      setActionLoading(feedbackId);
      await markFeedbackValuable(feedbackId, isValuable);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, isValuable } : f))
      );
    } catch (err) {
      console.error('Error marking feedback:', err);
      setError('Fehler beim Markieren');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm('User wirklich für Stoffberater-Feedback sperren?')) return;
    try {
      setActionLoading(userId);
      await blockUser(userId);
      alert('User gesperrt');
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Fehler beim Sperren');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await unblockUser(userId);
      alert('User entsperrt');
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError('Fehler beim Entsperren');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    switch (filter) {
      case 'valuable':
        return f.isValuable === true;
      case 'not_valuable':
        return f.isValuable === false;
      case 'unreviewed':
        return f.isValuable === null;
      default:
        return true;
    }
  });

  const getPlanBadge = (plan: string | undefined) => {
    switch (plan) {
      case 'pro':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pro</span>;
      case 'home':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Home</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Free</span>;
    }
  };

  const getInterestsDisplay = (interests: FeedbackEntry['interests']) => {
    const items = [];
    if (interests.stofferkennung) items.push('Stofferkennung');
    if (interests.verhaltensprofile) items.push('Verhaltensprofile');
    if (interests.toleranzen) items.push('Toleranzen');
    if (interests.pdfExport) items.push('PDF-Export');
    if (interests.bestPractice) items.push('Best Practice');
    return items.length > 0 ? items.join(', ') : 'Keine';
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
            <h1 className="text-2xl font-bold text-gray-900">Feedback-Verwaltung</h1>
            <p className="text-gray-600 mt-1">Stoffberater Pro Feedback ({feedbacks.length} gesamt)</p>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Alle' },
              { value: 'unreviewed', label: 'Ungeprüft' },
              { value: 'valuable', label: 'Wertvoll' },
              { value: 'not_valuable', label: 'Nicht wertvoll' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as FilterType)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === f.value
                    ? 'bg-[#532418] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Kein Feedback gefunden
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedbacks.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {feedback.createdAt.toLocaleDateString('de-DE')}
                        <br />
                        <span className="text-xs">{feedback.createdAt.toLocaleTimeString('de-DE')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {feedback.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanBadge(feedback.userPlan)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={feedback.feedbackText}>
                          {feedback.feedbackText || <span className="text-gray-400">Kein Text</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getInterestsDisplay(feedback.interests)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feedback.creditsGranted ? (
                          <span className="text-green-600">✓ +10</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feedback.isValuable === true && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Wertvoll</span>
                        )}
                        {feedback.isValuable === false && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Nicht wertvoll</span>
                        )}
                        {feedback.isValuable === null && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Ungeprüft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkValuable(feedback.id, true)}
                            disabled={actionLoading === feedback.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Als wertvoll markieren"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleMarkValuable(feedback.id, false)}
                            disabled={actionLoading === feedback.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Als nicht wertvoll markieren"
                          >
                            ✗
                          </button>
                          <button
                            onClick={() => handleBlockUser(feedback.userId)}
                            disabled={actionLoading === feedback.userId}
                            className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                            title="User sperren"
                          >
                            🚫
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{feedback.userEmail}</p>
                      <p className="text-sm text-gray-500">
                        {feedback.createdAt.toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlanBadge(feedback.userPlan)}
                      {feedback.isValuable === true && (
                        <span className="text-green-600">✓</span>
                      )}
                      {feedback.isValuable === false && (
                        <span className="text-red-600">✗</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                    className="mt-2 text-sm text-[#532418] hover:underline"
                  >
                    {expandedId === feedback.id ? 'Weniger' : 'Mehr'} anzeigen
                  </button>

                  {expandedId === feedback.id && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {feedback.feedbackText || 'Kein Feedback-Text'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Interessen: {getInterestsDisplay(feedback.interests)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleMarkValuable(feedback.id, true)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Wertvoll
                        </button>
                        <button
                          onClick={() => handleMarkValuable(feedback.id, false)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Nicht wertvoll
                        </button>
                        <button
                          onClick={() => handleBlockUser(feedback.userId)}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                        >
                          Sperren
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
