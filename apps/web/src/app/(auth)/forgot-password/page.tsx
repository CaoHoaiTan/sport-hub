'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';

import { FORGOT_PASSWORD } from '@/graphql/mutations/auth';
import { ROUTES } from '@/lib/constants';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const forgotPasswordSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [forgotPassword] = useMutation(FORGOT_PASSWORD);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    try {
      await forgotPassword({ variables: { email: values.email } });
      setIsEmailSent(true);
      toast.success('Đã gửi link đặt lại! Kiểm tra email của bạn.');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể gửi email. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEmailSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Kiểm tra email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi link đặt lại mật khẩu đến{' '}
            <span className="font-medium text-foreground">
              {form.getValues('email')}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Không nhận được email? Kiểm tra thư mục spam hoặc thử lại.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsEmailSent(false)}
          >
            Thử email khác
          </Button>
          <div className="text-center">
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Quên mật khẩu?</CardTitle>
        <CardDescription>
          Nhập email của bạn và chúng tôi sẽ gửi link đặt lại
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </Button>
          </form>
        </Form>
        <div className="text-center">
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
