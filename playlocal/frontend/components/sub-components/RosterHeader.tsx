import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns/format';
import { getSportImage } from '@/constants/sportImages';

type RosterHeaderProps = {
  game: {
    title: string;
    skillBand?: string; // intermediate
    intensityBand?: string; //competitive [intensity]
    sportName: string;
    startTime: string;
    location: {
      name: string;
    } | null;
  } | null;
};

const mockGame = {
  title: 'Sunday Soccer Match',
  skillBand: 'Intermediate',
  intensityBand: 'Competitive',
  sportName: 'Basketball',
  location: {
    name: 'Golden Gate Park Basketball Courts',
  },
};

export function RosterHeader({ game }: Readonly<RosterHeaderProps>) {
  const gameDate = game
    ? format(new Date(game.startTime), "EEEE, MMM d 'at' h:mm a")
    : '';
  const imageUrl = getSportImage(game?.sportName || mockGame.sportName);

  return (
    <div className="relative h-64 bg-gradient-to-br from-gray-900 to-gray-700">
      <img
        src={imageUrl}
        alt={game?.title || mockGame.title}
        className="w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
              {game?.sportName || mockGame.sportName}
            </div>
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
              {game?.skillBand || mockGame.skillBand}
            </div>
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
              {game?.intensityBand || mockGame.intensityBand} Intensity
            </div>
          </div>

          <div className="text-4xl text-white mb-2">
            {game?.title || mockGame.title}
          </div>

          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <div>{gameDate}</div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <div>{game?.location?.name || mockGame.location.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
