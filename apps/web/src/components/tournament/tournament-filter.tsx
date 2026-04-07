'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TournamentFilters {
  sport?: string;
  status?: string;
  search?: string;
}

interface TournamentFilterProps {
  onFilterChange: (filters: TournamentFilters) => void;
}

export function TournamentFilter({ onFilterChange }: TournamentFilterProps) {
  const [sport, setSport] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    onFilterChange({
      sport: sport === 'all' ? undefined : sport,
      status: status === 'all' ? undefined : status,
      search: debouncedSearch || undefined,
    });
  }, [sport, status, debouncedSearch, onFilterChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tournaments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={sport} onValueChange={setSport}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Sport" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sports</SelectItem>
          <SelectItem value="football">Football</SelectItem>
          <SelectItem value="volleyball">Volleyball</SelectItem>
          <SelectItem value="badminton">Badminton</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="registration">Registration</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Hủyled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
