import { Suspense } from 'react';
import NewPasswordClient from './NewPasswordClient';

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Set new password</h1>
            <p className="mt-2 text-gray-600">Loading reset page...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <NewPasswordClient />
    </Suspense>
  );
}