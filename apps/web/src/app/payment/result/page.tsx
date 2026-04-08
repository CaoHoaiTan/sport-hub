'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get('status');
  const tournamentId = searchParams.get('tournamentId');
  const reason = searchParams.get('reason');
  const code = searchParams.get('code');

  const isSuccess = status === 'success';

  function handleBack() {
    if (tournamentId) {
      router.push(`/tournaments/${tournamentId}/payments`);
    } else {
      router.push('/tournaments');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {isSuccess ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center text-sm text-muted-foreground space-y-2">
          {isSuccess ? (
            <p>
              Thanh toán đã hoàn tất thành công!
            </p>
          ) : (
            <>
              <p>Giao dịch không thành công. Vui lòng thử lại.</p>
              {reason === 'invalid_signature' && (
                <p className="text-xs text-destructive">Lỗi xác thực chữ ký thanh toán.</p>
              )}
              {code && reason !== 'invalid_signature' && (
                <p className="text-xs">Mã lỗi: {code}</p>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button onClick={handleBack} variant={isSuccess ? 'default' : 'outline'}>
            {tournamentId ? 'Về trang thanh toán' : 'Về danh sách giải đấu'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
