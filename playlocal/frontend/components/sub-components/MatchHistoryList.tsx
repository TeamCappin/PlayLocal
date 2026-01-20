import Link from "next/link";

export function MatchHistoryList() {
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
            <div className="flex mb-1 items-center gap-2">
              <div className="text-gray-900">GAME.TITLE</div>
              <div className="text-xs bg-gray-200 rounded-lg px-2">GAME.PARTICIPATION_ROLE</div>
            </div>
            <div className="text-sm text-gray-600">
              GAME.DATE • GAME.LOCATION
            </div>
          </div>
        </div>
        

        <div className="text-right">

          {/* <div className={`text-lg ${game.result === 'Win' ? 'text-emerald-600' : 'text-gray-600'} mb-1`}> */}
          <div className='text-lg text-emerald-600 mb-1'>

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
          <div className="text-gray-500">
            RATING
          </div>
          <div className="text-emerald-600">
            ATTENDANCE CONFIRMED
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