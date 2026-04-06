'use client';

import { useQuery } from '@apollo/client';
import { DollarSign, Clock, RotateCcw, Receipt } from 'lucide-react';

import { formatVND } from '@/lib/utils/format';
import { GET_FINANCIAL_SUMMARY } from '@/graphql/queries/payment';
import { StatCard } from '@/components/dashboard/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialSummaryProps {
  tournamentId: string;
}

export function FinancialSummary({ tournamentId }: FinancialSummaryProps) {
  const { data, loading } = useQuery(GET_FINANCIAL_SUMMARY, {
    variables: { tournamentId },
    skip: !tournamentId,
  });

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const summary = data?.financialSummary;
  if (!summary) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatVND(summary.totalRevenue)}
        description={`${summary.paidCount} paid`}
        icon={DollarSign}
      />
      <StatCard
        title="Total Pending"
        value={formatVND(summary.totalPending)}
        description={`${summary.paymentCount - summary.paidCount - summary.overdueCount} pending`}
        icon={Clock}
      />
      <StatCard
        title="Total Refunded"
        value={formatVND(summary.totalRefunded)}
        icon={RotateCcw}
      />
      <StatCard
        title="Payment Count"
        value={summary.paymentCount}
        description={`${summary.overdueCount} overdue`}
        icon={Receipt}
      />
    </div>
  );
}
