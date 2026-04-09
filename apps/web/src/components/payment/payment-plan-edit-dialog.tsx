'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { UPDATE_PAYMENT_PLAN } from '@/graphql/mutations/payment';
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
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';

interface PaymentPlanEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  plan: {
    id: string;
    name: string;
    amount: number;
    perTeam: boolean;
    earlyBirdAmount: number | null;
    earlyBirdDeadline: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountHolder: string | null;
    transferContent: string | null;
  };
}

export function PaymentPlanEditDialog({
  open,
  onOpenChange,
  tournamentId,
  plan,
}: PaymentPlanEditDialogProps) {
  const [name, setName] = useState(plan.name);
  const [amount, setAmount] = useState(String(plan.amount));
  const [perTeam, setPerTeam] = useState(plan.perTeam);
  const [earlyBirdAmount, setEarlyBirdAmount] = useState(
    plan.earlyBirdAmount ? String(plan.earlyBirdAmount) : ''
  );
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState(
    plan.earlyBirdDeadline ? plan.earlyBirdDeadline.slice(0, 16) : ''
  );
  const [bankName, setBankName] = useState(plan.bankName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(plan.bankAccountNumber ?? '');
  const [bankAccountHolder, setBankAccountHolder] = useState(plan.bankAccountHolder ?? '');
  const [transferContent, setTransferContent] = useState(plan.transferContent ?? '');

  const [updatePlan, { loading }] = useMutation(UPDATE_PAYMENT_PLAN, {
    refetchQueries: [{ query: GET_PAYMENT_PLANS, variables: { tournamentId } }],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updatePlan({
        variables: {
          id: plan.id,
          input: {
            name,
            amount: parseFloat(amount),
            perTeam,
            earlyBirdAmount: earlyBirdAmount ? parseFloat(earlyBirdAmount) : null,
            earlyBirdDeadline: earlyBirdDeadline || null,
            bankName: bankName || null,
            bankAccountNumber: bankAccountNumber || null,
            bankAccountHolder: bankAccountHolder || null,
            transferContent: transferContent || null,
          },
        },
      });
      toast.success('Đã cập nhật gói thanh toán.');
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa gói thanh toán</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-plan-name">Tên gói</Label>
            <Input
              id="edit-plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-plan-amount">Số tiền (VND)</Label>
            <Input
              id="edit-plan-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={0}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Theo từng đội</p>
              <p className="text-xs text-muted-foreground">
                Tính phí riêng cho mỗi đội
              </p>
            </div>
            <Switch checked={perTeam} onCheckedChange={setPerTeam} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-early-bird-amount">Giá ưu đãi sớm (VND)</Label>
            <Input
              id="edit-early-bird-amount"
              type="number"
              placeholder="Số tiền giảm giá (tùy chọn)"
              value={earlyBirdAmount}
              onChange={(e) => setEarlyBirdAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-early-bird-deadline">Hạn chót ưu đãi sớm</Label>
            <Input
              id="edit-early-bird-deadline"
              type="datetime-local"
              value={earlyBirdDeadline}
              onChange={(e) => setEarlyBirdDeadline(e.target.value)}
            />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-medium">Thông tin chuyển khoản</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              * Bắt buộc nếu muốn đội thanh toán qua chuyển khoản
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-bank-name">Tên ngân hàng</Label>
              <Input
                id="edit-bank-name"
                placeholder="VD: Vietcombank, MB Bank..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bank-account">Số tài khoản</Label>
              <Input
                id="edit-bank-account"
                placeholder="VD: 1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bank-holder">Chủ tài khoản</Label>
              <Input
                id="edit-bank-holder"
                placeholder="VD: NGUYEN VAN A"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-transfer-content">Nội dung chuyển khoản</Label>
              <Input
                id="edit-transfer-content"
                placeholder={name ? `VD: [Tên đội] - ${name}` : 'VD: [Tên đội] - Lệ phí giải ABC'}
                value={transferContent}
                onChange={(e) => setTransferContent(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
