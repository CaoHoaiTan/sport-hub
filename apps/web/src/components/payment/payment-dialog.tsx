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
import { PromoCodeInput } from './promo-code-input';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentPlanId: string;
  teamId: string;
  tournamentId: string;
  amount: number;
}

const methods = [
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: Banknote },
  { value: 'momo', label: 'MoMo', icon: Smartphone },
  { value: 'vnpay', label: 'VNPay', icon: Globe },
  { value: 'cash', label: 'Tiền mặt', icon: CreditCard },
] as const;

export function PaymentDialog({
  open,
  onOpenChange,
  paymentPlanId,
  teamId,
  tournamentId,
  amount,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<string>('bank_transfer');
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const [initiatePayment, { loading }] = useMutation(INITIATE_PAYMENT);

  const finalAmount = Math.max(0, amount - discount);

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

      toast.success('Payment initiated successfully.');
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
          <DialogTitle>Make Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors',
                      method === m.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setMethod(m.value)}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mã giảm giá</p>
            <PromoCodeInput
              tournamentId={tournamentId}
              amount={amount}
              onValidated={handlePromoValidated}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatVND(amount)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatVND(finalAmount)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handlePay} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
