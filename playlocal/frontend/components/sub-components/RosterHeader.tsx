import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns/format';

// Helper to get image by sport (US 2.2)
function getSportImage(sport: string) {
  const images: Record<string, string> = {
    Basketball:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1080',
    Soccer:
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1080',
    Tennis:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1080',
    Volleyball:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1080',
    Badminton:
      'https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?auto=format&fit=crop&q=80&w=1080',
    Baseball: '/images/sports/baseball.jpg',
    Hockey:
      'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80&w=1080',
    'Ultimate Frisbee': '/images/sports/ultimate-frisbee.jpg',
    'Flag Football':
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1080',
    Softball:
      'https://images.unsplash.com/photo-1578432014316-48b448d79d57?auto=format&fit=crop&q=80&w=1080',
    Pickleball:
      'https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?auto=format&fit=crop&q=80&w=1080',
  };
  return (
    images[sport] ||
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1080'
  );
}

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
