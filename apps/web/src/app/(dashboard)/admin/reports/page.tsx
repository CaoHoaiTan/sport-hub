'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
  Shield,
  FileText,
  Download,
  BarChart3,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isAdmin } from '@/lib/utils/roles';
import { GET_MY_TOURNAMENTS } from '@/graphql/queries/tournament';
import { GRAPHQL_HTTP_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const { data, loading } = useQuery(GET_MY_TOURNAMENTS, {
    skip: !user || !isAdmin(user.role),
  });

  if (!user || !isAdmin(user.role)) {
    return (
      <EmptyState
        icon={Shield}
        title="Access Denied"
        description="You do not have permission to view this page."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const tournaments = data?.myTournaments ?? [];

  function handleExport(type: 'tournament' | 'financial') {
    if (!selectedTournament) {
      toast.error('Please select a tournament first.');
      return;
    }
    const endpoint = type === 'tournament'
      ? `${GRAPHQL_HTTP_URL.replace('/graphql', '')}/export/tournament/${selectedTournament}`
      : `${GRAPHQL_HTTP_URL.replace('/graphql', '')}/export/financial/${selectedTournament}`;

    window.open(endpoint, '_blank');
    toast.success(`${type === 'tournament' ? 'Tournament' : 'Financial'} report export initiated.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export tournament reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTournament}
            onValueChange={setSelectedTournament}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(
                (t: { id: string; name: string }) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tournament Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Includes teams, matches, standings, and results.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('tournament')}
              disabled={!selectedTournament}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Tournament Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Financial Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Includes payment plans, transactions, and revenue summary.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('financial')}
              disabled={!selectedTournament}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Financial Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
