'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';

import { useAuth } from '@/lib/auth/context';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
import { UPDATE_PROFILE, CHANGE_PASSWORD } from '@/graphql/mutations/user';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and change your password.
        </p>
      </div>
      <ProfileForm />
      <Separator />
      <PasswordForm />
    </div>
  );
}

function ProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  async function onSubmit(values: ProfileValues) {
    setIsSubmitting(true);
    try {
      await updateProfile({
        variables: {
          input: {
            fullName: values.fullName,
            phone: values.phone || null,
            avatarUrl: values.avatarUrl || null,
          },
        },
      });
      toast.success('Profile updated successfully.');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update profile.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your name, phone number, and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+84 123 456 789"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changePassword] = useMutation(CHANGE_PASSWORD);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: PasswordValues) {
    setIsSubmitting(true);
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        },
      });
      toast.success('Password changed successfully.');
      form.reset();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to change password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Changing...' : 'Change password'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
