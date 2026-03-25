import { Suspense } from 'react';
import ValidateResetCodeClient from './ValidateResetCodeClient';

function ValidateResetCodeFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full" style={{ maxWidth: '32rem' }}>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Check your inbox</h1>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ValidateResetCodePage() {
  return (
    <Suspense fallback={<ValidateResetCodeFallback />}>
      <ValidateResetCodeClient />
    </Suspense>
  );
}