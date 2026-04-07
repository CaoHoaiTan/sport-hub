'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Users,
  Loader2,
  LogIn,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { REGISTER_TEAM } from '@/graphql/mutations/team';
import { TeamCard } from '@/components/team/team-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function PublicRegisterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [registered, setRegistered] = useState(false);

  const { data: tournamentData, loading: loadingTournament } = useQuery(
    GET_PUBLIC_TOURNAMENT,
    {
      variables: { slug },
      skip: !slug,
    }
  );

  const tournament = tournamentData?.publicTournament;
  const tournamentId = tournament?.id;

  const { data: teamsData, loading: loadingTeams } = useQuery(
    GET_TEAMS_BY_TOURNAMENT,
    {
      variables: { tournamentId },
      skip: !tournamentId,
    }
  );

  const [registerTeam, { loading: registering }] = useMutation(REGISTER_TEAM, {
    refetchQueries: tournamentId
      ? [{ query: GET_TEAMS_BY_TOURNAMENT, variables: { tournamentId } }]
      : [],
  });

  const teams = teamsData?.teamsByTournament ?? [];
  const isRegistrationOpen = tournament?.status === 'registration';
  const isFull =
    tournament?.maxTeams && teams.length >= tournament.maxTeams;

  // Check if current user already has a team registered
  const userTeam = user
    ? teams.find(
        (t: { managerId?: string; manager?: { id: string } }) =>
          t.managerId === user.id || t.manager?.id === user.id
      )
    : null;

  useEffect(() => {
    if (userTeam) setRegistered(true);
  }, [userTeam]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !tournamentId) return;
    try {
      await registerTeam({
        variables: {
          input: {
            tournamentId,
            name: teamName.trim(),
            logoUrl: teamLogo.trim() || null,
          },
        },
      });
      toast.success('Đăng ký đội thành công!');
      setRegistered(true);
      setTeamName('');
      setTeamLogo('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(message);
    }
  }

  if (loadingTournament) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <div className="text-center text-muted-foreground py-12 space-y-2">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p>Giải đấu hiện không mở đăng ký.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Đăng ký tham gia</h1>
          <p className="text-sm text-muted-foreground">
            Đăng ký đội của bạn vào giải đấu này.
          </p>
        </div>
        <Badge variant="secondary">
          {teams.length}
          {tournament.maxTeams ? ` / ${tournament.maxTeams} đội` : ' đội'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registration form */}
        <div className="lg:col-span-2">
          {!user ? (
            /* Not logged in */
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <LogIn className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <div>
                  <h3 className="font-semibold">Đăng nhập để đăng ký</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bạn cần có tài khoản để đăng ký đội tham gia giải đấu.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link href={`${ROUTES.login}?redirect=/t/${slug}/register`}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`${ROUTES.register}?redirect=/t/${slug}/register`}>
                      Tạo tài khoản
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : registered || userTeam ? (
            /* Already registered */
            <Card className="border-success/30">
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                <div>
                  <h3 className="font-semibold">Đã đăng ký thành công!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Đội của bạn đã được đăng ký tham gia giải đấu này.
                  </p>
                </div>
                {userTeam && (
                  <Button asChild variant="outline">
                    <Link href={ROUTES.teamDetail(userTeam.id)}>
                      Quản lý đội
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : isFull ? (
            /* Full */
            <Card>
              <CardContent className="py-12 text-center space-y-2">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <h3 className="font-semibold">Giải đấu đã đủ đội</h3>
                <p className="text-sm text-muted-foreground">
                  Đã đạt số đội tối đa ({tournament.maxTeams} đội).
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Registration form */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đăng ký đội mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Tên đội *</Label>
                    <Input
                      id="team-name"
                      placeholder="Nhập tên đội của bạn"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-logo">Logo URL (tùy chọn)</Label>
                    <Input
                      id="team-logo"
                      placeholder="https://example.com/logo.png"
                      value={teamLogo}
                      onChange={(e) => setTeamLogo(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registering || !teamName.trim()}
                  >
                    {registering && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Đăng ký đội
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Registered teams sidebar */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Đội đã đăng ký</h3>
          {loadingTeams ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có đội nào đăng ký.
            </p>
          ) : (
            <div className="space-y-3">
              {teams.map(
                (team: {
                  id: string;
                  name: string;
                  logoUrl?: string | null;
                  manager?: { id: string; fullName: string } | null;
                  groupName?: string | null;
                  seed?: number | null;
                }) => (
                  <TeamCard key={team.id} team={team} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
