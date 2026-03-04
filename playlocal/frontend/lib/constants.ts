// Shared form constants for profile-related components
import {
  Flame,
  Smile,
  Zap,
  Calendar,
  Clock,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface IntensityOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface AvailabilityOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const INTENSITY_OPTIONS: IntensityOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Learning & casual',
    icon: Zap,
  },
  { id: 'casual', label: 'Casual', description: 'Fun & relaxed', icon: Smile },
  {
    id: 'competitive',
    label: 'Competitive',
    description: 'Serious play',
    icon: Flame,
  },
];

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  { id: 'weekdays', label: 'Weekdays', icon: Calendar },
  { id: 'weekends', label: 'Weekends', icon: Sunrise },
  { id: 'flexible', label: 'Flexible', icon: Clock },
  { id: 'mornings', label: 'Mornings', icon: Sunrise },
  { id: 'evenings', label: 'Evenings', icon: Sunset },
  { id: 'afternoons', label: 'Afternoons', icon: Sun },
];
