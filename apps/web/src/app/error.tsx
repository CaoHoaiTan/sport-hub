'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // logger.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Đã xảy ra lỗi
        </h1>
        <p className="max-w-md text-muted-foreground">
          Đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi
          tiếp tục.
        </p>
      </div>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
