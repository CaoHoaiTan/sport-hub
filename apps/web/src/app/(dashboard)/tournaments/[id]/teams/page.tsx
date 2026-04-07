'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Shuffle,
  Trash2,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import {
  REGISTER_TEAM,
  DELETE_TEAM,
  DRAW_GROUPS,
} from '@/graphql/mutations/team';
import { TeamCard } from '@/components/team/team-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function TournamentTeamsPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [registerOpen, setRegisterOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  // Register form
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');

  // Draw groups form
  const [groupCount, setGroupCount] = useState('4');

  const { data: tournamentData } = useQuery(GET_TOURNAMENT, {
    variables: { id },
    skip: !id,
  });

  const { data: teamsData, loading } = useQuery(GET_TEAMS_BY_TOURNAMENT, {
    variables: { tournamentId: id },
    skip: !id,
  });

  const refetchConfig = {
    refetchQueries: [
      { query: GET_TEAMS_BY_TOURNAMENT, variables: { tournamentId: id } },
    ],
  };

  const [registerTeam, { loading: registering }] = useMutation(
    REGISTER_TEAM,
    refetchConfig
  );

  const [deleteTeam, { loading: deleting }] = useMutation(
    DELETE_TEAM,
    refetchConfig
  );

  const [drawGroups, { loading: drawing }] = useMutation(
    DRAW_GROUPS,
    refetchConfig
  );

  const tournament = tournamentData?.tournament;
  const teams = teamsData?.teamsByTournament ?? [];
  const canManage = user && isOrganizer(user.role);
  const isRegistrationOpen = tournament?.status === 'registration';
  const canRegister =
    user &&
    (isRegistrationOpen ||
      (canManage && tournament?.status === 'draft'));
  const canDraw =
    canManage &&
    tournament?.format === 'group_stage_knockout' &&
    teams.length >= 4;

  async function handleRegister() {
    if (!teamName.trim()) return;
    try {
      await registerTeam({
        variables: {
          input: {
            tournamentId: id,
            name: teamName.trim(),
            logoUrl: teamLogo.trim() || null,
          },
        },
      });
      toast.success('Đăng ký đội thành công.');
      setTeamName('');
      setTeamLogo('');
      setRegisterOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!deleteTeamId) return;
    try {
      await deleteTeam({ variables: { id: deleteTeamId } });
      toast.success('Đã xóa đội.');
      setDeleteTeamId(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Xóa thất bại';
      toast.error(message);
    }
  }

  async function handleDrawGroups() {
    const count = parseInt(groupCount, 10);
    if (isNaN(count) || count < 2) {
      toast.error('Số bảng phải lớn hơn hoặc bằng 2.');
      return;
    }
    try {
      await drawGroups({
        variables: { tournamentId: id, groupCount: count },
      });
      toast.success('Bốc thăm chia bảng thành công.');
      setDrawOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Bốc thăm thất bại';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Đội tham gia</h2>
          <Badge variant="secondary">
            {teams.length}
            {tournament?.maxTeams ? ` / ${tournament.maxTeams}` : ''}
          </Badge>
        </div>

        {canManage && (
          <div className="flex gap-2">
            {canDraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawOpen(true)}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Bốc thăm chia bảng
              </Button>
            )}
            {canRegister && (
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Đăng ký đội
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có đội nào"
          description="Chưa có đội nào đăng ký tham gia giải đấu này."
          action={
            canRegister
              ? {
                  label: 'Đăng ký đội đầu tiên',
                  onClick: () => setRegisterOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(
            (team: {
              id: string;
              name: string;
              logoUrl?: string | null;
              manager?: { id: string; fullName: string } | null;
              groupName?: string | null;
              seed?: number | null;
            }) => (
              <div key={team.id} className="relative group">
                <TeamCard team={team} />
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteTeamId(team.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Register Team Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký đội mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Tên đội *</Label>
              <Input
                id="team-name"
                placeholder="Nhập tên đội"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-logo">Logo URL</Label>
              <Input
                id="team-logo"
                placeholder="https://example.com/logo.png"
                value={teamLogo}
                onChange={(e) => setTeamLogo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterOpen(false)}
              disabled={registering}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRegister}
              disabled={registering || !teamName.trim()}
            >
              {registering && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draw Groups Dialog */}
      <Dialog open={drawOpen} onOpenChange={setDrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bốc thăm chia bảng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Các đội sẽ được chia ngẫu nhiên vào các bảng. Hiện có{' '}
              <strong>{teams.length}</strong> đội.
            </p>
            <div className="space-y-2">
              <Label htmlFor="group-count">Số bảng</Label>
              <Input
                id="group-count"
                type="number"
                min={2}
                max={Math.floor(teams.length / 2)}
                value={groupCount}
                onChange={(e) => setGroupCount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDrawOpen(false)}
              disabled={drawing}
            >
              Hủy
            </Button>
            <Button onClick={handleDrawGroups} disabled={drawing}>
              {drawing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Bốc thăm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteTeamId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTeamId(null);
        }}
        title="Xóa đội"
        description="Bạn có chắc muốn xóa đội này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Xóa"
        isLoading={deleting}
      />
    </div>
  );
}
