'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import { CREATE_PAYMENT_PLAN } from '@/graphql/mutations/payment';
import { GET_PAYMENT_PLANS } from '@/graphql/queries/payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';

interface PaymentPlanFormProps {
  tournamentId: string;
}

export function PaymentPlanForm({ tournamentId }: PaymentPlanFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [perTeam, setPerTeam] = useState(true);
  const [earlyBirdAmount, setEarlyBirdAmount] = useState('');
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState('');

  const [createPlan, { loading }] = useMutation(CREATE_PAYMENT_PLAN, {
    refetchQueries: [{ query: GET_PAYMENT_PLANS, variables: { tournamentId } }],
  });

  function resetForm() {
    setName('');
    setAmount('');
    setPerTeam(true);
    setEarlyBirdAmount('');
    setEarlyBirdDeadline('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPlan({
        variables: {
          input: {
            tournamentId,
            name,
            amount: parseFloat(amount),
            perTeam,
            earlyBirdAmount: earlyBirdAmount ? parseFloat(earlyBirdAmount) : null,
            earlyBirdDeadline: earlyBirdDeadline || null,
          },
        },
      });
      toast.success('Payment plan created.');
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create plan';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              placeholder="e.g., Tournament Entry Fee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-amount">Amount (VND)</Label>
            <Input
              id="plan-amount"
              type="number"
              placeholder="500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={0}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Per Team</p>
              <p className="text-xs text-muted-foreground">
                Charge each team separately
              </p>
            </div>
            <Switch checked={perTeam} onCheckedChange={setPerTeam} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-bird-amount">Early Bird Amount (VND)</Label>
            <Input
              id="early-bird-amount"
              type="number"
              placeholder="Optional discounted amount"
              value={earlyBirdAmount}
              onChange={(e) => setEarlyBirdAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-bird-deadline">Early Bird Deadline</Label>
            <Input
              id="early-bird-deadline"
              type="datetime-local"
              value={earlyBirdDeadline}
              onChange={(e) => setEarlyBirdDeadline(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
