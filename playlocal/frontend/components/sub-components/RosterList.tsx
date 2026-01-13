import { useState, useEffect } from 'react';
import { CircleCheckBig, CircleX } from 'lucide-react';
import { Button } from '../ui/button';
import { usersApi, UserDto } from '@/lib/api';

interface RosterListProps {
  userId: string;
  participationId: string;
  currentStatus: 'ATTENDED' | 'NO_SHOW' | 'UNKNOWN';
  onStatusChange: (participationId: string, status: 'ATTENDED' | 'NO_SHOW') => void;
}

export function RosterList({ userId, participationId, currentStatus, onStatusChange }: RosterListProps) {
  const [profile, setProfile] = useState<UserDto | null>(null);
  // Fetching user profile data based on participant.userId
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await usersApi.getProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        // console.log('Finished fetching profile for', userId);
      }
    };
    fetchData();
  }, [userId]);

  const nameInitials = profile?.displayName?.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2) || 'MR';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-colors">

        <div className='flex gap-2'>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
            <p>{nameInitials}</p>
          </div>
          <div>
            <div className="text-gray-900 mb-1">{profile?.displayName}</div>
            {/* PositionRole */}
            <div className="text-sm text-gray-600">
              Position Role • {profile?.defaultIntensity}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className='flex gap-2'>
            <div>
              <Button onClick={() => onStatusChange(participationId, 'ATTENDED')} className={`border-2 transition-colors ${currentStatus === 'ATTENDED'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-white hover:bg-emerald-200 border-gray-300'
                }`}>
                <CircleCheckBig />
                Attended
              </Button>
            </div>
            <div>
              <Button onClick={() => onStatusChange(participationId, 'NO_SHOW')} className={`border-2 transition-colors ${currentStatus === 'NO_SHOW'
                ? 'bg-gray-400'
                : 'hover:bg-gray-200'
                }`}>
                <CircleX />
                No show
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}