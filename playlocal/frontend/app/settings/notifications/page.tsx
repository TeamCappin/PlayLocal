'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotificationSettings } from '@/components/SettingsPage';

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="space-y-6">
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}
