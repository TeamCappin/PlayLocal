'use client';
import { CircleCheckBig, CircleX, TriangleAlert, CircleAlert, Loader2, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/hooks/useGames';
import { useAttendance } from '@/hooks/useAttendance';
import { RosterHeader } from './sub-components/RosterHeader';
import { RosterList } from './sub-components/RosterList';
import { useState, useEffect, useRef } from 'react';

type Status = 'ATTENDED' | 'NO_SHOW' | 'UNKNOWN';

export function RsvpRoster() {
  const navigate = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  const { game, isLoading: gameLoading, error, refetch } = useGame(gameId);
  const { pendingAttendance, isLoading: attendanceLoading, isSubmitting, error: attendanceError, fetchPending, confirmAttendance } = useAttendance(gameId);

  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, {
    status: Status;
    participationId: string;
  }>>({});

  const hasInitialized = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pendingAttendance.length > 0 && !hasInitialized.current) {
      const initialStatuses = Object.fromEntries(
        pendingAttendance.map(item => [
          item.participationId,
          {
            status: item.attendanceStatus as Status,
            participationId: item.participationId,
          }
        ])
      );
      setAttendanceStatuses(initialStatuses);
      hasInitialized.current = true;
    }
  }, [pendingAttendance]);

  const uiPlayerCountAttended = Object.values(attendanceStatuses).filter(s => s.status === 'ATTENDED').length;
  const uiPlayerCountNoShows = Object.values(attendanceStatuses).filter(s => s.status === 'NO_SHOW').length;
  const uiParticipantsCountLeftToMark = pendingAttendance.length - uiPlayerCountAttended - uiPlayerCountNoShows;


  const uiPlayerCountTotal = pendingAttendance.length;

  const handleAttendanceChange = (participationId: string, status: Status) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [participationId]: {
        status,
        participationId,
      }
    }));
  };

  // Submit attendance to backend
  const handleSubmit = async () => {
    // Populate AttendanceEntry array with all required fields
    const attendances = Object.values(attendanceStatuses).map(entry => {
      const participant = pendingAttendance.find(p => p.participationId === entry.participationId);
      return {
        participationId: entry.participationId,
        attendanceStatus: entry.status as 'ATTENDED' | 'NO_SHOW',
        userId: participant?.userId || '',
        sportId: participant?.sportId || '',
        requestedPositionRoleId: participant?.requestedPositionRoleId || '',
      };
    });

    if (attendances.length !== pendingAttendance.length) {
      alert('Please mark all players before submitting');
      return;
    }

    try {
      console.log('Submitting attendance:', attendances);
      const response = await confirmAttendance(attendances);
      console.log('Attendance submitted successfully:', response);
      navigate.push('/profile');
    } catch (err) {
      console.error('Failed to submit attendance:', err);
      alert('Failed to submit attendance. Please try again.');
    }
  };

  const handleRetryGame = () => refetch();
  const handleRetryAttendance = () => {
    hasInitialized.current = false;
    fetchPending();
  };

  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    navigate.push('/login');
    return null;
  }

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Loading game...</p>
          <button
            onClick={() => navigate.push('/profile')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className='flex items-center justify-center gap-2 mb-4'>
            <CircleAlert className="w-12 h-12 text-red-600" />
            <p className="text-gray-900 font-medium">{error}</p>
          </div>
          <div className="flex gap-3 px-8 mx-4 sm:w-auto sm:flex-row flex-col">
            <button
              onClick={() => navigate.push('/profile')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRetryGame}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RosterHeader game={game} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">

          <div className="flex bg-amber-50 rounded-xl border border-gray-200 px-6 py-3 mb-8 gap-4 items-center">
            <div>
              <CircleAlert className='text-red-600 w-8 h-8' />
            </div>
            <div className='flex-col'>
              <div className="text-xl text-gray-900 mb-2">
                Confirm Player Attendance
              </div>
              <div>
                Please mark each player's attendance status. Once submitted, this record will be locked and cannot be changed without admin approval. This helps maintain accurate attendance records and reputation scores.
              </div>
            </div>
          </div>

          {attendanceLoading ? (
            <>
              <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-xl border border-gray-200 bg-white">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-gray-600">Loading roster...</p>
              </div>
              <div className="flex justify-start mt-8">
                <button
                  onClick={() => navigate.push('/profile')}
                  className="px-8 py-4 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : attendanceError ? (
            <>
              <div className="flex-col justify-center items-center gap-4 py-16 rounded-xl border border-gray-200 bg-white text-center p-4">
                <div className='flex items-center justify-center gap-2 mb-4'>
                  <CircleAlert className="w-10 h-10 text-red-600 shrink-0" />
                  <p className="text-gray-900 font-medium">{attendanceError}</p>
                </div>
                <button
                  onClick={handleRetryAttendance}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => navigate.push('/profile')}
                  className="px-8 py-4 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-8">

                <div className='flex bg-white rounded-xl border border-gray-200 px-6 py-3 gap-4 items-center'>
                  <div>
                    <CircleCheckBig className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className='flex-col'>
                    <div className="text-3xl text-gray-900">
                      {uiPlayerCountAttended}
                    </div>
                    <div className='text-gray-600'>
                      Attended
                    </div>
                  </div>
                </div>

                <div className='flex bg-white rounded-xl border border-gray-200 px-6 py-3 gap-4 items-center'>
                  <div>
                    <CircleX className="w-10 h-10 text-red-600" />
                  </div>
                  <div className='flex-col'>
                    <div className="text-3xl text-gray-900">
                      {uiPlayerCountNoShows}
                    </div>
                    <div className='text-gray-600'>
                      No Shows
                    </div>
                  </div>
                </div>

                <div className='flex bg-white rounded-xl border border-gray-200 px-6 py-3 gap-4 items-center'>
                  <div>
                    <TriangleAlert className="w-10 h-10 text-gray-500" />
                  </div>
                  <div className='flex-col'>
                    <div className="text-3xl text-gray-900">
                      {uiParticipantsCountLeftToMark}
                    </div>
                    <div className='text-gray-600'>
                      Not Marked
                    </div>
                  </div>
                </div>

              </div>
              <div className="grid">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex-col">
                    <div className='text-3xl text-gray-900 mb-2'>
                      RSVP Roster ({uiPlayerCountTotal} players)
                    </div>
                    <div className='text-gray-600 pb-6'>
                      Mark each player as attended or no-show
                    </div>
                  </div>
                  <div className="space-y-3">
                    {pendingAttendance.map((p) => (
                      <RosterList
                        key={p.participationId}
                        userId={p.userId}
                        participationId={p.participationId}
                        currentStatus={attendanceStatuses[p.participationId]?.status || 'UNKNOWN'}
                        onStatusChange={handleAttendanceChange}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {uiParticipantsCountLeftToMark != 0 && (
                <div className="flex bg-amber-50 rounded-xl border border-gray-200 px-6 py-3 mt-8 gap-4 items-center">
                  <div>
                    <CircleAlert className='text-red-600 w-8 h-8' />
                  </div>
                  <div className='flex-col'>
                    <div className="text-xl text-gray-900 mb-2">
                      You must mark all players before submitting
                    </div>
                    <div>
                      {uiParticipantsCountLeftToMark} players still need to be marked.
                    </div>
                  </div>
                </div>)}

              <div className='flex justify-between mt-8'>
                <button
                  onClick={() => navigate.push('/profile')}
                  className="px-8 py-4 bg-red-500 rounded-lg items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uiParticipantsCountLeftToMark > 0 || isSubmitting}
                  className="px-8 py-4 bg-emerald-500 rounded-lg items-center justify-center text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  );
}


