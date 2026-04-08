'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';

import { formatVND, formatDateTime } from '@/lib/utils/format';
import { CONFIRM_MANUAL_PAYMENT, REFUND_PAYMENT } from '@/graphql/mutations/payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  transactionId: string | null;
  paidAt: string | null;
  team: { id: string; name: string } | null;
  paymentPlan: { id: string; name: string } | null;
}

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
  showRefund?: boolean;
  onRefunded?: () => void;
  onConfirmed?: () => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
};

const methodLabels: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  momo: 'MoMo',
  vnpay: 'VNPay',
};

const statusVariants: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  refunded: 'secondary',
};

const MANUAL_METHODS = ['bank_transfer', 'cash'];

export function PaymentTable({
  payments,
  isLoading = false,
  showRefund = false,
  onRefunded,
  onConfirmed,
}: PaymentTableProps) {
  const [refundId, setRefundId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null);
  const [transactionId, setTransactionId] = useState('');

  const [confirmPayment, { loading: confirming }] = useMutation(CONFIRM_MANUAL_PAYMENT, {
    onCompleted: () => {
      toast.success('Đã xác nhận thanh toán.');
      setConfirmTarget(null);
      setTransactionId('');
      onConfirmed?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const [refundPayment, { loading: refunding }] = useMutation(REFUND_PAYMENT, {
    onCompleted: () => {
      toast.success('Đã hoàn tiền thành công.');
      setRefundId(null);
      onRefunded?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = [
    {
      key: 'team',
      header: 'Đội',
      render: (row: Payment) => (
        <span className="font-medium">{row.team?.name ?? '-'}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Gói',
      render: (row: Payment) => (
        <span className="text-sm text-muted-foreground">{row.paymentPlan?.name ?? '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (row: Payment) => formatVND(row.amount),
    },
    {
      key: 'method',
      header: 'Phương thức',
      render: (row: Payment) => (
        <span>{methodLabels[row.method ?? ''] ?? row.method ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: Payment) => (
        <Badge variant={statusVariants[row.status] ?? 'secondary'}>
          {statusLabels[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      key: 'transactionId',
      header: 'Mã GD',
      render: (row: Payment) => (
        <span className="font-mono text-xs">{row.transactionId ?? '-'}</span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Thời gian TT',
      render: (row: Payment) => (row.paidAt ? formatDateTime(row.paidAt) : '-'),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Payment) => {
        const canConfirm =
          showRefund &&
          MANUAL_METHODS.includes(row.method ?? '') &&
          (row.status === 'pending' || row.status === 'overdue');
        const canRefund = showRefund && row.status === 'paid';

        if (!canConfirm && !canRefund) return null;

        return (
          <div className="flex gap-2">
            {canConfirm && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => {
                  setConfirmTarget(row);
                  setTransactionId('');
                }}
              >
                Xác nhận đã nhận tiền
              </Button>
            )}
            {canRefund && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setRefundId(row.id)}
              >
                Hoàn tiền
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={payments as Array<Payment & Record<string, unknown>>}
        isLoading={isLoading}
        emptyMessage="Chưa có thanh toán"
        emptyDescription="Chưa có khoản thanh toán nào được thực hiện."
        keyExtractor={(row) => row.id}
      />

      {/* Confirm manual payment dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
            setTransactionId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đã nhận tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đội</span>
                <span className="font-medium">{confirmTarget?.team?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-bold">{confirmTarget ? formatVND(confirmTarget.amount) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phương thức</span>
                <span>{methodLabels[confirmTarget?.method ?? ''] ?? confirmTarget?.method}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-id">
                Mã giao dịch{' '}
                <span className="text-muted-foreground font-normal">
                  {confirmTarget?.method === 'bank_transfer' ? '(số tham chiếu chuyển khoản)' : '(tùy chọn)'}
                </span>
              </Label>
              <Input
                id="txn-id"
                placeholder={
                  confirmTarget?.method === 'bank_transfer'
                    ? 'Nhập mã tham chiếu ngân hàng...'
                    : 'Không bắt buộc'
                }
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Hủy
            </Button>
            <Button
              disabled={confirming}
              onClick={() => {
                if (confirmTarget) {
                  confirmPayment({
                    variables: {
                      paymentId: confirmTarget.id,
                      transactionId: transactionId.trim() || undefined,
                    },
                  });
                }
              }}
            >
              {confirming ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund confirm dialog */}
      <ConfirmDialog
        open={!!refundId}
        onOpenChange={(open) => {
          if (!open) setRefundId(null);
        }}
        title="Hoàn tiền"
        description="Bạn có chắc muốn hoàn tiền khoản này không? Hành động này không thể hoàn tác."
        variant="destructive"
        confirmLabel="Hoàn tiền"
        isLoading={refunding}
        onConfirm={() => {
          if (refundId) {
            refundPayment({
              variables: { paymentId: refundId, reason: 'Organizer initiated refund' },
            });
          }
        }}
      />
    </>
  );
}
