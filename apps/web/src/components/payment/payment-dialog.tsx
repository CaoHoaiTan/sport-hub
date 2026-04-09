'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CreditCard, Loader2, Banknote, Smartphone, Globe } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { formatVND } from '@/lib/utils/format';
import { INITIATE_PAYMENT } from '@/graphql/mutations/payment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PromoCodeInput } from './promo-code-input';

interface BankInfo {
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  transferContent?: string | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentPlanId: string;
  teamId: string;
  tournamentId: string;
  amount: number;
  earlyBirdAmount?: number | null;
  earlyBirdDeadline?: string | null;
  bankInfo?: BankInfo | null;
}

const methods = [
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: Banknote, disabled: false },
  { value: 'momo', label: 'MoMo', icon: Smartphone, disabled: true, disabledReason: 'Chưa hỗ trợ' },
  { value: 'vnpay', label: 'VNPay', icon: Globe, disabled: false },
  { value: 'cash', label: 'Tiền mặt', icon: CreditCard, disabled: false },
] as const;

export function PaymentDialog({
  open,
  onOpenChange,
  paymentPlanId,
  teamId,
  tournamentId,
  amount,
  earlyBirdAmount,
  earlyBirdDeadline,
  bankInfo,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<string>('bank_transfer');
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const [initiatePayment, { loading }] = useMutation(INITIATE_PAYMENT);

  const isEarlyBird =
    earlyBirdAmount != null &&
    earlyBirdDeadline != null &&
    new Date() < new Date(earlyBirdDeadline);
  const displayAmount = isEarlyBird ? earlyBirdAmount : amount;
  const finalAmount = Math.max(0, displayAmount - discount);

  async function handlePay() {
    try {
      const { data } = await initiatePayment({
        variables: {
          input: {
            paymentPlanId,
            teamId,
            method,
            promoCode,
          },
        },
      });

      const payment = data?.initiatePayment;
      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      toast.success('Đã ghi nhận thanh toán. Ban tổ chức sẽ xác nhận sau.');
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast.error(message);
    }
  }

  function handlePromoValidated(discountAmount: number, code: string) {
    setDiscount(discountAmount);
    setPromoCode(code);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thanh toán</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Phương thức thanh toán</p>
            <TooltipProvider>
              <div className="grid grid-cols-2 gap-2">
                {methods.map((m) => {
                  const Icon = m.icon;
                  const btn = (
                    <button
                      key={m.value}
                      type="button"
                      disabled={m.disabled}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors',
                        m.disabled
                          ? 'cursor-not-allowed opacity-50'
                          : method === m.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'hover:bg-muted/50'
                      )}
                      onClick={() => !m.disabled && setMethod(m.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );

                  if (m.disabled && 'disabledReason' in m) {
                    return (
                      <Tooltip key={m.value}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent>{m.disabledReason}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return btn;
                })}
              </div>
            </TooltipProvider>
          </div>

          {method === 'bank_transfer' && bankInfo?.bankAccountNumber && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-2">
              <p className="text-sm font-medium">Thông tin chuyển khoản</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                {bankInfo.bankName && (
                  <>
                    <span className="text-muted-foreground">Ngân hàng</span>
                    <span className="font-medium">{bankInfo.bankName}</span>
                  </>
                )}
                <span className="text-muted-foreground">Số TK</span>
                <span className="font-mono font-medium">{bankInfo.bankAccountNumber}</span>
                {bankInfo.bankAccountHolder && (
                  <>
                    <span className="text-muted-foreground">Chủ TK</span>
                    <span className="font-medium">{bankInfo.bankAccountHolder}</span>
                  </>
                )}
                {bankInfo.transferContent && (
                  <>
                    <span className="text-muted-foreground">Nội dung CK</span>
                    <span className="font-medium">{bankInfo.transferContent}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {method === 'bank_transfer' && !bankInfo?.bankAccountNumber && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Ban tổ chức chưa cập nhật thông tin chuyển khoản. Vui lòng liên hệ ban tổ chức để biết thông tin tài khoản.
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mã giảm giá</p>
            <PromoCodeInput
              tournamentId={tournamentId}
              amount={displayAmount}
              onValidated={handlePromoValidated}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giá gốc</span>
              <span className={isEarlyBird ? 'line-through text-muted-foreground' : ''}>
                {formatVND(amount)}
              </span>
            </div>
            {isEarlyBird && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Early bird</span>
                <span>{formatVND(earlyBirdAmount)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Tổng cộng</span>
              <span>{formatVND(finalAmount)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handlePay}
            disabled={loading || (method === 'bank_transfer' && !bankInfo?.bankAccountNumber)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
