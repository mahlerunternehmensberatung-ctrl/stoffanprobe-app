import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  getUserStats,
  getImageStats,
  getActiveSubscriptions,
  UserStats,
} from '../../services/adminService';

const AdminDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [imageStats, setImageStats] = useState<{ today: number; thisWeek: number } | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [users, images, subs] = await Promise.all([
          getUserStats(),
          getImageStats(),
          getActiveSubscriptions(),
        ]);
        setUserStats(users);
        setImageStats(images);
        setActiveSubscriptions(subs);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Fehler beim Laden der Statistiken');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#532418]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Übersicht über alle wichtigen Kennzahlen</p>
        </div>

        {/* User Stats */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User-Statistiken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gesamt User"
              value={userStats?.total || 0}
              icon="👥"
              color="border-blue-500"
            />
            <StatCard
              title="Free User"
              value={userStats?.free || 0}
              icon="🆓"
              color="border-gray-500"
            />
            <StatCard
              title="Home User"
              value={userStats?.home || 0}
              icon="🏠"
              color="border-green-500"
            />
            <StatCard
              title="Pro User"
              value={userStats?.pro || 0}
              icon="⭐"
              color="border-yellow-500"
            />
          </div>
        </section>

        {/* New Registrations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Neue Anmeldungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Heute"
              value={userStats?.newToday || 0}
              subtitle="Neue Registrierungen"
              icon="📅"
              color="border-purple-500"
            />
            <StatCard
              title="Diese Woche"
              value={userStats?.newThisWeek || 0}
              subtitle="Neue Registrierungen"
              icon="📆"
              color="border-indigo-500"
            />
          </div>
        </section>

        {/* Images & Subscriptions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Aktivität & Abos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Bilder heute"
              value={imageStats?.today || 0}
              subtitle="Generiert"
              icon="🖼️"
              color="border-pink-500"
            />
            <StatCard
              title="Bilder diese Woche"
              value={imageStats?.thisWeek || 0}
              subtitle="Generiert"
              icon="📸"
              color="border-red-500"
            />
            <StatCard
              title="Aktive Abos"
              value={activeSubscriptions}
              subtitle="Home + Pro"
              icon="💳"
              color="border-emerald-500"
            />
          </div>
        </section>

        {/* Revenue Placeholder */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Einnahmen</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <span className="text-4xl block mb-2">💰</span>
                <p>Stripe-Integration für Einnahmen-Übersicht</p>
                <p className="text-sm">(Erfordert Stripe API-Anbindung)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex items-center"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="font-medium text-gray-900">User verwalten</p>
                <p className="text-sm text-gray-500">Credits anpassen, sperren</p>
              </div>
            </a>
            <a
              href="/admin/feedback"
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex items-center"
            >
              <span className="text-2xl mr-3">💬</span>
              <div>
                <p className="font-medium text-gray-900">Feedback prüfen</p>
                <p className="text-sm text-gray-500">Stoffberater-Feedback</p>
              </div>
            </a>
            <a
              href="/admin/waitlist"
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex items-center"
            >
              <span className="text-2xl mr-3">📋</span>
              <div>
                <p className="font-medium text-gray-900">Waitlist</p>
                <p className="text-sm text-gray-500">Interessenten ansehen</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
