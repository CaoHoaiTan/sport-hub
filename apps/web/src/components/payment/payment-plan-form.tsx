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
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [transferContent, setTransferContent] = useState('');

  const [createPlan, { loading }] = useMutation(CREATE_PAYMENT_PLAN, {
    refetchQueries: [{ query: GET_PAYMENT_PLANS, variables: { tournamentId } }],
  });

  function resetForm() {
    setName('');
    setAmount('');
    setPerTeam(true);
    setEarlyBirdAmount('');
    setEarlyBirdDeadline('');
    setBankName('');
    setBankAccountNumber('');
    setBankAccountHolder('');
    setTransferContent('');
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
            bankName: bankName || null,
            bankAccountNumber: bankAccountNumber || null,
            bankAccountHolder: bankAccountHolder || null,
            transferContent: transferContent || null,
          },
        },
      });
      toast.success('Đã tạo gói thanh toán.');
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Tạo gói thất bại';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm gói thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo gói thanh toán</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Tên gói</Label>
            <Input
              id="plan-name"
              placeholder="VD: Lệ phí tham gia giải đấu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-amount">Số tiền (VND)</Label>
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
              <p className="text-sm font-medium">Theo từng đội</p>
              <p className="text-xs text-muted-foreground">
                Tính phí riêng cho mỗi đội
              </p>
            </div>
            <Switch checked={perTeam} onCheckedChange={setPerTeam} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-bird-amount">Giá ưu đãi sớm (VND)</Label>
            <Input
              id="early-bird-amount"
              type="number"
              placeholder="Số tiền giảm giá (tùy chọn)"
              value={earlyBirdAmount}
              onChange={(e) => setEarlyBirdAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-bird-deadline">Hạn chót ưu đãi sớm</Label>
            <Input
              id="early-bird-deadline"
              type="datetime-local"
              value={earlyBirdDeadline}
              onChange={(e) => setEarlyBirdDeadline(e.target.value)}
            />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-medium">Thông tin chuyển khoản</p>
            <p className="text-xs text-muted-foreground">
              Hiển thị cho đội khi chọn phương thức chuyển khoản ngân hàng
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              * Bắt buộc nếu muốn đội thanh toán qua chuyển khoản
            </p>
            <div className="space-y-2">
              <Label htmlFor="bank-name">Tên ngân hàng</Label>
              <Input
                id="bank-name"
                placeholder="VD: Vietcombank, MB Bank..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-account">Số tài khoản</Label>
              <Input
                id="bank-account"
                placeholder="VD: 1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-holder">Chủ tài khoản</Label>
              <Input
                id="bank-holder"
                placeholder="VD: NGUYEN VAN A"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-content">Nội dung chuyển khoản</Label>
              <Input
                id="transfer-content"
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
              Tạo gói
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
