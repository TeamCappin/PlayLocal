import { CircleAlert } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { usePastGamesByUser } from '@/hooks/useGames';
import { tr } from 'date-fns/locale';
import { useState } from 'react';

export function ActionsRequired() {
  const navigate = useRouter();
  const { isAuthenticated, user } = useAuth();

  const { games, isLoading, error, refetch } = usePastGamesByUser(user?.userId || '');
  console.log('Past games fetched from API:', games);
  const actionsRequired = games.length;

  const handleClickConfirmAttendance = () => {
    if (!isAuthenticated) {
      navigate.push('/login');
      return;
    }
    console.log("Confirm Attendance button clicked");
  }

  return (

    <div>
      {actionsRequired != 0 && (
        <div className="pt-8">
          <div className="bg-amber-100 rounded-xl border border-gray-200 p-6">
            <span className='flex items-center gap-2 mb-4'>
              <CircleAlert color="red" size={35} />
              <h2 className="text-xl text-gray-900 leading-none">Actions Required</h2>
            </span>
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.gameId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-gray-900">{game.title}</div>
                      <div className="text-sm text-gray-600">
                        {game.startTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      key={game.gameId}
                      href={`/rsvpRoster/${game.gameId}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button onClick={handleClickConfirmAttendance} className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white hover:text-emerald-700">
                        Confirm Attendance
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}