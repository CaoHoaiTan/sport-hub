'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';

import { cn } from '@/lib/utils/cn';
import { formatVND, formatDateTime } from '@/lib/utils/format';
import { REFUND_PAYMENT } from '@/graphql/mutations/payment';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

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
}

const statusVariants: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  refunded: 'secondary',
};

export function PaymentTable({
  payments,
  isLoading = false,
  showRefund = false,
  onRefunded,
}: PaymentTableProps) {
  const [refundId, setRefundId] = useState<string | null>(null);

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
      key: 'amount',
      header: 'Số tiền',
      render: (row: Payment) => formatVND(row.amount),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: Payment) => (
        <Badge variant={statusVariants[row.status] ?? 'secondary'} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'method',
      header: 'Phương thức',
      render: (row: Payment) => (
        <span className="capitalize">{row.method?.replace('_', ' ') ?? '-'}</span>
      ),
    },
    {
      key: 'transactionId',
      header: 'Mã giao dịch',
      render: (row: Payment) => (
        <span className="font-mono text-xs">{row.transactionId ?? '-'}</span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Thời gian thanh toán',
      render: (row: Payment) =>
        row.paidAt ? formatDateTime(row.paidAt) : '-',
    },
    ...(showRefund
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: Payment) =>
              row.status === 'paid' ? (
                <button
                  type="button"
                  className="text-xs text-destructive hover:underline"
                  onClick={() => setRefundId(row.id)}
                >
                  Hoàn tiền
                </button>
              ) : null,
          },
        ]
      : []),
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
