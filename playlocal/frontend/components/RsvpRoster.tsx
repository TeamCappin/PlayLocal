import { BadgeAlert } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { CircleCheckBig, CircleX } from 'lucide-react';

export function RsvpRoster() {



  const rsvpRosterInfo = {
    gameId: 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', //game
    sportName: 'Basketball', //sport
    gameSkillBand: 'Intermediate',
    gameIntensityBand: 'High Intensity',
    gameStatus: 'COMPLETED',
    gameTitle: '5v5 Basketball Pickup',
    gameStartTime: new Date().toISOString(),
    gameLocationId: 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    locationName: 'Parc Jary Courts', //location
    uiPlayerCount: 10,
    participantsList: ['get participants ids based on gameId', 'get name based on participation_id -> user_id -> display_name', 'get game role based on sport_id + requested_position_role_id -> name'], //game_participation
    participantDefaultIntensity: 'game_participation_id -> user_id -> default_intensity',
    uiParticipantsCountLeftToMark: 0,
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="text-gray-900 mb-1">{rsvpRosterInfo.gameTitle}</div>
                    <div className="text-sm text-gray-600">
                      {rsvpRosterInfo.gameStartTime} • {rsvpRosterInfo.locationName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className='flex'>
                      <div>
                        <Button>
                          <CircleCheckBig/>
                          Attended
                        </Button>
                      </div>
                      <div>
                        <Button>
                          <CircleX/>
                          No-show
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


