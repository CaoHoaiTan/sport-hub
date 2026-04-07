'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Users,
  LogIn,
  ShieldAlert,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { QR_CHECKIN } from '@/graphql/mutations/checkin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GET_CHECKIN_INFO = gql`
  query CheckinInfoByCode($code: String!) {
    checkinInfoByCode(code: $code) {
      matchId
      isOpen
      homeTeam { id name }
      awayTeam { id name }
      homePlayers { id fullName jerseyNumber userId }
      awayPlayers { id fullName jerseyNumber userId }
    }
  }
`;

interface Player {
  id: string;
  fullName: string;
  jerseyNumber?: number | null;
  userId?: string | null;
  teamName?: string;
}

export default function CheckinPublicPage() {
  return (
    <Suspense>
      <CheckinFlow />
    </Suspense>
  );
}

function CheckinFlow() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const codeFromUrl = searchParams.get('code') ?? '';

  const [code, setCode] = useState(codeFromUrl);
  const [enteredCode, setEnteredCode] = useState(codeFromUrl);
  const [success, setSuccess] = useState(false);
  const [checkedPlayerName, setCheckedPlayerName] = useState('');

  const { data, loading: loadingInfo, error: infoError } = useQuery(GET_CHECKIN_INFO, {
    variables: { code: enteredCode },
    skip: !enteredCode,
    fetchPolicy: 'network-only',
  });

  const [qrCheckin, { loading: checkingIn }] = useMutation(QR_CHECKIN);

  const info = data?.checkinInfoByCode;

  // Find the current user's player record
  const myPlayer = useMemo(() => {
    if (!user || !info) return null;
    const allPlayers: Player[] = [
      ...(info.homePlayers ?? []).map((p: Player) => ({ ...p, teamName: info.homeTeam?.name })),
      ...(info.awayPlayers ?? []).map((p: Player) => ({ ...p, teamName: info.awayTeam?.name })),
    ];
    return allPlayers.find((p) => p.userId === user.id) ?? null;
  }, [user, info]);

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnteredCode(code.trim());
  }

  async function handleCheckin() {
    if (!myPlayer || !enteredCode) return;
    try {
      await qrCheckin({
        variables: { code: enteredCode, playerId: myPlayer.id },
      });
      setCheckedPlayerName(myPlayer.fullName);
      setSuccess(true);
      toast.success('Check-in thành công!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in thất bại';
      toast.error(message);
    }
  }

  // Success
  if (success) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <h2 className="text-xl font-bold">Check-in thành công!</h2>
            <p className="text-sm text-muted-foreground">{checkedPlayerName}</p>
            <p className="text-sm text-muted-foreground">Chúc thi đấu tốt!</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // No code — show input
  if (!enteredCode) {
    return (
      <PageWrapper>
        <Card>
          <CardHeader className="text-center">
            <IconCircle icon={QrCode} />
            <CardTitle>Check-in trận đấu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-code">Mã check-in</Label>
                <Input
                  id="qr-code"
                  placeholder="Nhập mã hoặc quét QR code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Tiếp tục</Button>
            </form>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // Loading
  if (loadingInfo) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin trận đấu...</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // Error
  if (infoError) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-bold">Không thể check-in</h2>
            <p className="text-sm text-muted-foreground">{infoError.message}</p>
            <Button variant="outline" onClick={() => { setEnteredCode(''); setCode(''); }}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // Not open
  if (info && !info.isOpen) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning" />
            <h2 className="text-lg font-bold">Check-in chưa mở</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng chờ ban tổ chức mở check-in cho trận đấu này.
            </p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // Not logged in
  if (!user) {
    const redirectUrl = `/checkin?code=${enteredCode}`;
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <IconCircle icon={LogIn} />
            <h2 className="text-lg font-bold">Đăng nhập để check-in</h2>
            <p className="text-sm text-muted-foreground">
              Bạn cần đăng nhập bằng tài khoản đã được liên kết với vận động viên.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href={`${ROUTES.login}?redirect=${encodeURIComponent(redirectUrl)}`}>
                  Đăng nhập
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // User not found in player list
  if (!myPlayer) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <IconCircle icon={ShieldAlert} />
            <h2 className="text-lg font-bold">Không tìm thấy thông tin</h2>
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn ({user.email}) chưa được liên kết với vận động viên nào trong trận đấu này.
            </p>
            <p className="text-sm text-muted-foreground">
              Vui lòng liên hệ quản lý đội để được thêm vào danh sách.
            </p>
          </CardContent>
        </Card>

        {/* Show match info */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <p className="text-center text-sm text-muted-foreground">
              Trận đấu: {info?.homeTeam?.name ?? 'TBD'} vs {info?.awayTeam?.name ?? 'TBD'}
            </p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // Found player — confirm checkin
  return (
    <PageWrapper>
      <Card>
        <CardHeader className="text-center">
          <IconCircle icon={Users} />
          <CardTitle>Xác nhận check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {info?.homeTeam?.name ?? 'TBD'} vs {info?.awayTeam?.name ?? 'TBD'}
          </div>

          <div className="rounded-lg border p-4 space-y-2 text-center">
            <p className="text-lg font-bold">{myPlayer.fullName}</p>
            {myPlayer.jerseyNumber != null && (
              <p className="text-sm text-muted-foreground">Số áo: #{myPlayer.jerseyNumber}</p>
            )}
            <p className="text-sm text-muted-foreground">{myPlayer.teamName}</p>
          </div>

          <Button
            className="w-full"
            disabled={checkingIn}
            onClick={handleCheckin}
          >
            {checkingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận Check-in
          </Button>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md px-4 py-16">{children}</div>;
}

function IconCircle({ icon: Icon }: { icon: typeof QrCode }) {
  return (
    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
  );
}
