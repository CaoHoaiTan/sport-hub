'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';

import { RESET_PASSWORD } from '@/graphql/mutations/auth';
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

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetPassword] = useMutation(RESET_PASSWORD);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <Link href={ROUTES.forgotPassword}>Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    setIsSubmitting(true);
    try {
      await resetPassword({
        variables: {
          input: {
            token,
            newPassword: values.newPassword,
          },
        },
      });
      toast.success('Password reset successfully! Please sign in.');
      router.push(ROUTES.login);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </Form>
        <div className="text-center">
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
