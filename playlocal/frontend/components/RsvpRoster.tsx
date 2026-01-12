'use client';
import Link from 'next/link';
import { Button } from './ui/button';
import { CircleCheckBig, CircleX, TriangleAlert, CircleAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useGame } from '@/hooks/useGames';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { RosterHeader } from './sub-components/RosterHeader';


export function RsvpRoster() {
  const navigate = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  // TODO MEL delete later
  console.log('RsvpRoster component loaded for gameId:', gameId);
  const { game, error, refetch } = useGame(gameId);
  const { pendingAttendance, isLoading, isSubmitting, error: attendanceError, fetchPending, confirmAttendance } = useAttendance(gameId);

  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    navigate.push('/login');
    return;
  }

  type RsvpRosterInfo = {
    // Game
    gameId: string;
    gameTitle: string;
    gameStartTime: string;
    gameStatus: 'COMPLETED' | 'CANCELLED' | 'UPCOMING';

    // Sport / metadata
    sportName: string;
    gameSkillBand: string;
    gameIntensityBand: string;

    // Location
    gameLocationId: string;
    locationName: string;

    // UI counters (derived)
    uiPlayerCountAttended: number;
    uiPlayerCountNoShows: number;
    uiPlayerCountTotal: number;
    uiParticipantsCountLeftToMark: number;

    // Participants (inline object, not separate type)
    participants: {
      participationId: string;
      userId: string;
      displayName: string;
      positionRole: string;
      defaultIntensity: string;
      attendanceStatus: 'ATTENDED' | 'NO_SHOW' | 'UNKNOWN';
    }[];
  };


  const rsvpRosterInfoList: RsvpRosterInfo[] = []; // TODO MEL fetch based on gameId

  const rsvpRosterInfo = {
    gameId: gameId, //game
    sportName: game?.sportName, //sport
    gameSkillBand: game?.skillBand,
    gameIntensityBand: game?.intensityBand,
    gameStatus: game?.status,
    gameTitle: game?.title, //game
    gameStartTime: game?.startTime ? format(new Date(game.startTime), "EEEE, MMM d 'at' h:mm a") : 'Date Template',
    locationName: game?.location?.name, //location
    locationName: 'Parc Jary Courts', //location
    uiPlayerCountAttended: 0,
    uiPlayerCountNoShows: 0,
    uiPlayerCountTotal: 8,
    participantsList: ['get participants ids based on gameId', 'get name based on participation_id -> user_id -> display_name', 'get game role based on sport_id + requested_position_role_id -> name'], //game_participation
    participantPositionRole: 'Guard',
    participantDefaultIntensity: 'Intermediate', //'game_participation_id -> user_id -> default_intensity',
    uiParticipantsCountLeftToMark: 0,
  };


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

          <div className="grid md:grid-cols-3 gap-4 mb-8">

            <div className='flex bg-white rounded-xl border border-gray-200 px-6 py-3 gap-4 items-center'>
              <div>
                <CircleCheckBig className="w-10 h-10 text-emerald-600" />
              </div>
              <div className='flex-col'>
                <div className="text-3xl text-gray-900">
                  {rsvpRosterInfo.uiPlayerCountAttended}
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
                  {rsvpRosterInfo.uiPlayerCountNoShows}
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
                  {rsvpRosterInfo.uiParticipantsCountLeftToMark}
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
                  RSVP Roster ({rsvpRosterInfo.uiPlayerCountTotal} players)
                </div>
                <div className='text-gray-600 pb-6'>
                  Mark each player as attended or no-show
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-colors">

                  <div className='flex gap-2'>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                      <p>MR</p>
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1">{rsvpRosterInfo.gameTitle}</div>
                      <div className="text-sm text-gray-600">
                        {rsvpRosterInfo.participantPositionRole} • {rsvpRosterInfo.participantDefaultIntensity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className='flex gap-2'>
                      <div>
                        <Button className='border-2 hover:bg-emerald-200 transition-colors'>
                          <CircleCheckBig />
                          Attended
                        </Button>
                      </div>
                      <div>
                        <Button className='border-2 hover:bg-gray-200 transition-colors'>
                          <CircleX />
                          No show
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex bg-amber-50 rounded-xl border border-gray-200 px-6 py-3 mt-8 gap-4 items-center">
            <div>
              <CircleAlert className='text-red-600 w-8 h-8' />
            </div>
            <div className='flex-col'>
              <div className="text-xl text-gray-900 mb-2">
                You must mark all players before submitting
              </div>
              <div>
                {rsvpRosterInfo.uiParticipantsCountLeftToMark} players still need to be marked.
              </div>
            </div>
          </div>

          <div className='flex justify-between mt-8'>
            <button className="px-8 py-4 bg-red-500 rounded-lg items-center justify-center text-white">
              Cancel
            </button>
            <button className="px-8 py-4 bg-emerald-500 rounded-lg items-center justify-center text-white">
              Submit Attendance
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}


