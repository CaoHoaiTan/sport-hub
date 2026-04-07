'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { formatDate, formatVND } from '@/lib/utils/format';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { UPDATE_TOURNAMENT_STATUS } from '@/graphql/mutations/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { TournamentStatusBadge } from '@/components/tournament/tournament-status-badge';

const formatLabels: Record<string, string> = {
  round_robin: 'Round Robin',
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  group_stage_knockout: 'Group Stage + Knockout',
};

export default function TournamentOverviewPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TOURNAMENT, {
    variables: { id },
    skip: !id,
  });

  const [updateStatus, { loading: updating }] = useMutation(
    UPDATE_TOURNAMENT_STATUS,
    {
      refetchQueries: [{ query: GET_TOURNAMENT, variables: { id } }],
    }
  );

  const tournament = data?.tournament;
  const canManage = user && isOrganizer(user.role);

  async function handleStatusChange(newStatus: string) {
    try {
      await updateStatus({
        variables: { id, status: newStatus },
      });
      toast.success(`Tournament status updated to ${newStatus}.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Tournament data not available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {tournament.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={Calendar}
                  label="Start Date"
                  value={
                    tournament.startDate
                      ? formatDate(tournament.startDate)
                      : 'Not set'
                  }
                />
                <InfoItem
                  icon={Calendar}
                  label="End Date"
                  value={
                    tournament.endDate
                      ? formatDate(tournament.endDate)
                      : 'Not set'
                  }
                />
                <InfoItem
                  icon={Users}
                  label="Players per Team"
                  value={`${tournament.minPlayersPerTeam} - ${tournament.maxPlayersPerTeam}`}
                />
                <InfoItem
                  icon={Users}
                  label="Max Teams"
                  value={tournament.maxTeams ? String(tournament.maxTeams) : 'Unlimited'}
                />
                <InfoItem
                  icon={DollarSign}
                  label="Entry Fee"
                  value={
                    tournament.entryFee > 0
                      ? formatVND(tournament.entryFee)
                      : 'Free'
                  }
                />
                <InfoItem
                  icon={FileText}
                  label="Format"
                  value={
                    formatLabels[tournament.format] ?? tournament.format
                  }
                />
              </div>

              {tournament.registrationStart && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Calendar}
                      label="Registration Opens"
                      value={formatDate(tournament.registrationStart)}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Registration Closes"
                      value={
                        tournament.registrationEnd
                          ? formatDate(tournament.registrationEnd)
                          : 'Not set'
                      }
                    />
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Points System
                </p>
                <div className="flex gap-4">
                  <Badge variant="success">W: {tournament.pointsForWin}</Badge>
                  <Badge variant="warning">D: {tournament.pointsForDraw}</Badge>
                  <Badge variant="secondary">L: {tournament.pointsForLoss}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {canManage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Current:
                  </span>
                  <TournamentStatusBadge status={tournament.status} />
                </div>

                <Separator />

                <div className="space-y-2">
                  {tournament.status === 'draft' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('registration')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      Open Registration
                    </Button>
                  )}

                  {tournament.status === 'registration' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      Start Tournament
                    </Button>
                  )}

                  {tournament.status === 'in_progress' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('completed')}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Complete Tournament
                    </Button>
                  )}

                  {tournament.status !== 'cancelled' &&
                    tournament.status !== 'completed' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={updating}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy Tournament
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Hủy Tournament
                            </DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel this tournament?
                              This action cannot be undone. All registered teams
                              and scheduled matches will be affected.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Keep Tournament</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusChange('cancelled')}
                              disabled={updating}
                            >
                              {updating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Yes, Hủy Tournament
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
