import { CircleAlert, Clock } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { usePastGamesByUserNeedingAttendanceUpdate } from '@/hooks/useGames';
import { format } from 'date-fns/format';

export function ActionsRequired() {
  const navigate = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { games } = usePastGamesByUserNeedingAttendanceUpdate();
  const actionsRequired = games.length;

  const handleClickConfirmAttendance = () => {
    if (!isAuthenticated) {
      navigate.push('/login');
      return;
    }
    console.log('Confirm Attendance button clicked');
  };

  return (
    <div>
      {actionsRequired != 0 && (
        <div className="pt-8">
          <div className="bg-amber-100 rounded-xl border border-amber-200 p-6">
            <span className="flex items-center gap-2 mb-4">
              <CircleAlert color="red" size={30} />
              <h2 className="text-xl text-gray-900 leading-none">
                Actions Required
              </h2>
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
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        {game
                          ? format(
                              new Date(game.startTime),
                              "EEEE, MMM d 'at' h:mm a"
                            )
                          : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      key={game.gameId}
                      href={`/rsvpRoster/${game.gameId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <button onClick={handleClickConfirmAttendance}>
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
