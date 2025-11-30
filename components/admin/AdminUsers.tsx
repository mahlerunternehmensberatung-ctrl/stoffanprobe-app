import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getAllUsers,
  searchUsers,
  blockUser,
  unblockUser,
  adjustUserCredits,
  addTagToUser,
  removeTagFromUser,
  AVAILABLE_TAGS,
  AdminUser,
} from '../../services/adminService';
import { UserTag } from '../../types';

type FilterTag = UserTag | 'all';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<FilterTag>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingCredits, setEditingCredits] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [creditValues, setCreditValues] = useState<{ monthly: number; purchased: number }>({
    monthly: 0,
    purchased: 0,
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = searchQuery ? await searchUsers(searchQuery) : await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Fehler beim Laden der User');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleBlockUser = async (userId: string) => {
    if (!confirm('User wirklich für Stoffberater-Feedback sperren?')) return;
    try {
      setActionLoading(userId);
      await blockUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, feedbackBlocked: true } : u))
      );
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
      setUsers((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, feedbackBlocked: false } : u))
      );
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError('Fehler beim Entsperren');
    } finally {
      setActionLoading(null);
    }
  };

  const startEditingCredits = (user: AdminUser) => {
    setEditingCredits(user.uid);
    setEditingTags(null);
    setCreditValues({
      monthly: user.monthlyCredits,
      purchased: user.purchasedCredits,
    });
  };

  const handleSaveCredits = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adjustUserCredits(userId, creditValues.monthly, creditValues.purchased);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === userId
            ? { ...u, monthlyCredits: creditValues.monthly, purchasedCredits: creditValues.purchased }
            : u
        )
      );
      setEditingCredits(null);
    } catch (err) {
      console.error('Error adjusting credits:', err);
      setError('Fehler beim Anpassen der Credits');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddTag = async (userId: string, tag: UserTag) => {
    try {
      setActionLoading(userId);
      await addTagToUser(userId, tag);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === userId ? { ...u, tags: [...u.tags, tag] } : u
        )
      );
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Fehler beim Hinzufügen des Tags');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTag = async (userId: string, tag: UserTag) => {
    try {
      setActionLoading(userId);
      await removeTagFromUser(userId, tag);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === userId ? { ...u, tags: u.tags.filter((t) => t !== tag) } : u
        )
      );
    } catch (err) {
      console.error('Error removing tag:', err);
      setError('Fehler beim Entfernen des Tags');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pro</span>;
      case 'home':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Home</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Free</span>;
    }
  };

  const getTagBadge = (tag: UserTag) => {
    const colors: Record<UserTag, string> = {
      VIP: 'bg-purple-100 text-purple-800',
      Influencer: 'bg-pink-100 text-pink-800',
      'Beta-Tester': 'bg-blue-100 text-blue-800',
      Partner: 'bg-indigo-100 text-indigo-800',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[tag]}`}>
        {tag}
      </span>
    );
  };

  // Filter users by tag
  const filteredUsers = tagFilter === 'all'
    ? users
    : users.filter((u) => u.tags.includes(tagFilter));

  if (loading && users.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">User-Verwaltung</h1>
            <p className="text-gray-600 mt-1">{filteredUsers.length} User gefunden</p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Email suchen..."
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8956C] focus:border-transparent"
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
        </div>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              tagFilter === 'all'
                ? 'bg-[#532418] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle
          </button>
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                tagFilter === tag
                  ? 'bg-[#532418] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag} ({users.filter((u) => u.tags.includes(tag)).length})
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">
              ✕
            </button>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {searchQuery ? `Keine User für "${searchQuery}" gefunden` : 'Keine User gefunden'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bilder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letzter Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPlanBadge(user.plan)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center">
                              {getTagBadge(tag)}
                              <button
                                onClick={() => handleRemoveTag(user.uid, tag)}
                                className="ml-0.5 text-gray-400 hover:text-red-600"
                                title="Tag entfernen"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => setEditingTags(editingTags === user.uid ? null : user.uid)}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            title="Tag hinzufügen"
                          >
                            +
                          </button>
                        </div>
                        {editingTags === user.uid && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {AVAILABLE_TAGS.filter((t) => !user.tags.includes(t)).map((tag) => (
                              <button
                                key={tag}
                                onClick={() => handleAddTag(user.uid, tag)}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCredits === user.uid ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">
                              Monthly:
                              <input
                                type="number"
                                value={creditValues.monthly}
                                onChange={(e) =>
                                  setCreditValues({ ...creditValues, monthly: parseInt(e.target.value) || 0 })
                                }
                                className="ml-1 w-16 px-1 border rounded"
                              />
                            </label>
                            <label className="text-xs text-gray-500">
                              Purchased:
                              <input
                                type="number"
                                value={creditValues.purchased}
                                onChange={(e) =>
                                  setCreditValues({ ...creditValues, purchased: parseInt(e.target.value) || 0 })
                                }
                                className="ml-1 w-16 px-1 border rounded"
                              />
                            </label>
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => handleSaveCredits(user.uid)}
                                disabled={actionLoading === user.uid}
                                className="px-2 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCredits(null)}
                                className="px-2 py-0.5 text-xs bg-gray-300 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="font-medium">{user.monthlyCredits + user.purchasedCredits}</span>
                            <span className="text-gray-400 text-xs block">
                              ({user.monthlyCredits}m + {user.purchasedCredits}p)
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.imagesGenerated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt?.toLocaleDateString('de-DE') || 'Nie'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingCredits(user)}
                            disabled={actionLoading === user.uid}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Credits anpassen"
                          >
                            💰
                          </button>
                          {user.feedbackBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.uid)}
                              disabled={actionLoading === user.uid}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Entsperren"
                            >
                              🔓
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.uid)}
                              disabled={actionLoading === user.uid}
                              className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                              title="Sperren"
                            >
                              🔒
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.uid} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlanBadge(user.plan)}
                      {user.feedbackBlocked && (
                        <span className="text-red-600 text-xs">🔒</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center">
                        {getTagBadge(tag)}
                        <button
                          onClick={() => handleRemoveTag(user.uid, tag)}
                          className="ml-0.5 text-gray-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setEditingTags(editingTags === user.uid ? null : user.uid)}
                      className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      +
                    </button>
                  </div>
                  {editingTags === user.uid && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {AVAILABLE_TAGS.filter((t) => !user.tags.includes(t)).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(user.uid, tag)}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Credits:</span>
                      <span className="ml-1 font-medium">{user.monthlyCredits + user.purchasedCredits}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bilder:</span>
                      <span className="ml-1 font-medium">{user.imagesGenerated}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Login:</span>
                      <span className="ml-1">{user.lastLoginAt?.toLocaleDateString('de-DE') || 'Nie'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEditingCredits(user)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Credits
                    </button>
                    {user.feedbackBlocked ? (
                      <button
                        onClick={() => handleUnblockUser(user.uid)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Entsperren
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockUser(user.uid)}
                        className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                      >
                        Sperren
                      </button>
                    )}
                  </div>

                  {editingCredits === user.uid && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="flex gap-4">
                        <label className="text-sm">
                          Monthly:
                          <input
                            type="number"
                            value={creditValues.monthly}
                            onChange={(e) =>
                              setCreditValues({ ...creditValues, monthly: parseInt(e.target.value) || 0 })
                            }
                            className="ml-1 w-20 px-2 py-1 border rounded"
                          />
                        </label>
                        <label className="text-sm">
                          Purchased:
                          <input
                            type="number"
                            value={creditValues.purchased}
                            onChange={(e) =>
                              setCreditValues({ ...creditValues, purchased: parseInt(e.target.value) || 0 })
                            }
                            className="ml-1 w-20 px-2 py-1 border rounded"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveCredits(user.uid)}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingCredits(null)}
                          className="px-3 py-1 text-sm bg-gray-300 rounded"
                        >
                          Abbrechen
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

export default AdminUsers;
