'use client';

import { Clock } from 'lucide-react';

import { formatDateTime } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QrCodeDisplayProps {
  qrCode: {
    code: string;
    qrDataUrl?: string | null;
    expiresAt: string;
  };
}

export function QrCodeDisplay({ qrCode }: QrCodeDisplayProps) {
  const isExpired = new Date(qrCode.expiresAt) < new Date();
  const hasImage = qrCode.qrDataUrl && qrCode.qrDataUrl.startsWith('data:');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">QR Code Check-in</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative rounded-lg border bg-white p-3">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrCode.qrDataUrl!}
              alt="Check-in QR Code"
              width={200}
              height={200}
              className="h-48 w-48"
            />
          ) : (
            <div className="h-48 w-48 flex items-center justify-center text-center text-sm text-muted-foreground">
              Đóng và mở lại check-in để tạo mã QR mới
            </div>
          )}
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
              <span className="text-sm font-medium text-white">Hết hạn</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {isExpired
              ? 'Đã hết hạn'
              : `Hết hạn lúc ${formatDateTime(qrCode.expiresAt)}`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[220px]">
          Vận động viên quét mã này bằng điện thoại để check-in.
        </p>
      </CardContent>
    </Card>
  );
}
