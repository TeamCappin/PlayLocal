import Link from "next/link";
import { CircleCheckBig, CircleX, CircleAlert, CircleEllipsis, MapPin, Clock, Star, ChevronRight, Flag } from 'lucide-react';
import { format } from "date-fns/format";
import { gamesApi, ParticipantDto } from "@/lib/api";
import { useEffect, useState } from "react";

type MatchHistoryListProps = {
  game: {
    gameId: string;
    title: string;
    startTime: string;
    location: {
      name: string
    };

    // todo: get game.score
    // todo: get the game.team from participation table
    // todo: get game.result- won or loss participation table or some other table
    // todo: game.participation role from the participation table. 
    // todo: get attendance confirm/no show/confirm attendance/attendance pending from game participation table
  } | null;
  userId: string;
}

export function MatchHistoryList({ game, userId }: MatchHistoryListProps) {

  const [gameParticipation, setGameParticipation] = useState<ParticipantDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (game) {
          const data = await gamesApi.getGameParticipation(game.gameId, userId);
          setGameParticipation(data);
        }
      } catch (err) {
        console.error("Failed to fetch game participation", err);
      }
    };
    fetchData();
  }, [game, userId]);

  const getAttendanceDisplay = (status?: string, role?: string) => {
    switch (status) {
      case 'ATTENDED':
        return { text: 'Attendance Confirmed', color: 'text-emerald-600', Icon: CircleCheckBig };
      case 'NO_SHOW':
        return { text: 'No Show', color: 'text-red-600', Icon: CircleX };
      case 'UNKNOWN':
        if (role === 'ORGANIZER') {
          return { text: 'Attendance Not Confirmed', color: 'text-yellow-600', Icon: CircleAlert };
        }
        return { text: 'Attendance Not Confirmed', color: 'text-gray-500', Icon: CircleEllipsis };
      default:
        return { text: 'Attendance Status', color: 'text-gray-500', Icon: CircleEllipsis };
    }
  };
  const attendanceDisplay = getAttendanceDisplay(gameParticipation?.attendanceStatus, gameParticipation?.role);

  const isOrganizerUnknownAttendance = gameParticipation?.role === 'ORGANIZER' && gameParticipation?.attendanceStatus === 'UNKNOWN';
  const isParticipantUnknownAttendance = gameParticipation?.role !== 'ORGANIZER' && gameParticipation?.attendanceStatus === 'UNKNOWN';
  const gameDate = game ? format(new Date(game.startTime), "EEEE, MMM d 'at' h:mm a") : '';

  return (
    <div className="block p-4 flex-col items-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <Link
        key={game?.gameId}
        href={`/games/${game?.gameId}/recap`}
        className="block"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
              🏀
            </div>
            <div>
              <div className="flex mb-1 items-center gap-1">
                <div className="text-gray-900 text-lg">{game?.title}</div>
                <div className="text-xs text-emerald-600 bg-emerald-100 rounded-md px-2">{gameParticipation?.role}</div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    {gameDate}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    {game?.location.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">

            {/* <div className={`text-lg ${game.result === 'Win' ? 'text-emerald-600' : 'text-gray-600'} mb-1`}> */}
            <div className='mb-1 px-2 text-lg rounded-md text-emerald-600 bg-emerald-100 inline-block'>

              Result

            </div>
            {/* </div> */}

            <div className="text-sm text-gray-500">
              Team • Score
            </div>

          </div >
        </div >
      </Link>

      <div className="flex justify-between mt-2 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-500">
            <div> <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> </div>
            <div>
              Rating
            </div>
          </div>
          <div className={`flex items-center gap-1 ${attendanceDisplay.color}`}>
            <div>
              <attendanceDisplay.Icon className="w-4 h-4" />
            </div>
            <div>
              {attendanceDisplay.text}
            </div>
          </div>
        </div>

        {!isParticipantUnknownAttendance && (
          <div className="text-right">
            {isOrganizerUnknownAttendance ? (
              <Link
                key={game?.gameId}
                href={`/rsvpRoster/${game?.gameId}`}
                className="inline-flex items-center text-yellow-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <div className="px-2">Confirm Attendance</div>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <Flag className="w-4 h-4" />
                Report Issue
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}