import { Circle, Feather, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type SportType = 'football' | 'volleyball' | 'badminton';

const sportIconMap: Record<SportType, LucideIcon> = {
  football: Circle,
  volleyball: Circle,
  badminton: Feather,
};

export const sportColorMap: Record<SportType, string> = {
  football: 'text-green-600',
  volleyball: 'text-orange-500',
  badminton: 'text-blue-500',
};

export const sportBgColorMap: Record<SportType, string> = {
  football: 'bg-green-100 text-green-700',
  volleyball: 'bg-orange-100 text-orange-700',
  badminton: 'bg-blue-100 text-blue-700',
};

interface SportIconProps {
  sport: string;
  className?: string;
}

export function SportIcon({ sport, className }: SportIconProps) {
  const normalizedSport = sport.toLowerCase() as SportType;
  const Icon = sportIconMap[normalizedSport] ?? Circle;
  const colorClass = sportColorMap[normalizedSport] ?? 'text-muted-foreground';

  return <Icon className={cn('h-4 w-4', colorClass, className)} />;
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    football: 'Football',
    volleyball: 'Volleyball',
    badminton: 'Badminton',
  };
  return labels[sport.toLowerCase()] ?? sport;
}
