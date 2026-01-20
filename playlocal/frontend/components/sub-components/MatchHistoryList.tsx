import Link from "next/link";
import { CircleCheckBig, CircleX, CircleAlert, CircleEllipsis, MapPin, Clock, Star } from 'lucide-react';
import { format } from "date-fns/format";

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
}

export function MatchHistoryList({ game }: MatchHistoryListProps) {

  const gameDate = game ? format(new Date(game.startTime), "EEEE, MMM d 'at' h:mm a") : '';

  return (
    // {/* instead of the div, use the link. */ }

    // {/* <Link
    //   className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
    //   > */}
    <div className="flex-col items-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors p-4">

      <div className="flex items-center justify-between mb-2">

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
            🏀
          </div>
          <div>
            <div className="flex mb-1 items-center gap-1">
              <div className="text-gray-900 text-lg">{game?.title}</div>
              <div className="text-xs text-gray-600 bg-gray-200 rounded-md px-2">GAME.PARTICIPATION_ROLE</div>
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
          <div className='mb-1 px-2 text-lg rounded-md text-emerald-600 bg-emerald-50 inline-block'>

            GAME.RESULT

          </div>
          {/* </div> */}

          <div className="text-sm text-gray-500">
            GAME.TEAM • GAME.SCORE
          </div>

        </div >
      </div >

      <div>
        <hr />
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-500">
            <div>
              starLogo
            </div>
            <div>
              RATING
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <div>
              tick/alert/xLogo
            </div>
            <div>
              ATTENDANCE CONFIRMED/NO SHOW/CONFIRM ATTENDENCE/ATTENDANCE PENDING
            </div>
          </div>
        </div>
        <div className="text-right text-emerald-600">
          VIEW DETAILS {'>'}
        </div>
      </div>
    </div>
    //  </Link> 
  );
}