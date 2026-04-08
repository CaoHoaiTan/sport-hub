'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { CreditCard } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer, isAdmin } from '@/lib/utils/roles';
import { formatVND, formatDate } from '@/lib/utils/format';
import {
  GET_PAYMENT_PLANS,
  GET_PAYMENTS_BY_TOURNAMENT,
} from '@/graphql/queries/payment';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { PaymentPlanForm } from '@/components/payment/payment-plan-form';
import { PaymentTable } from '@/components/payment/payment-table';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import { FinancialSummary } from '@/components/payment/financial-summary';

export default function PaymentsPage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);

  const canManage = user && (isOrganizer(user.role) || isAdmin(user.role));

  // Find user's team in this tournament
  const { data: teamsData } = useQuery(GET_TEAMS_BY_TOURNAMENT, {
    variables: { tournamentId },
    skip: !tournamentId,
  });
  const myTeam = (teamsData?.teamsByTournament ?? []).find(
    (t: { managerId?: string; manager?: { id: string } }) =>
      user && (t.managerId === user.id || t.manager?.id === user.id)
  );

  const { data: plansData, loading: plansLoading } = useQuery(
    GET_PAYMENT_PLANS,
    { variables: { tournamentId }, skip: !tournamentId }
  );

  const {
    data: paymentsData,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery(GET_PAYMENTS_BY_TOURNAMENT, {
    variables: { tournamentId },
    skip: !tournamentId || !canManage,
  });

  const plans = plansData?.paymentPlansByTournament ?? [];
  const payments = paymentsData?.paymentsByTournament ?? [];

  if (plansLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payments</h2>
          <p className="text-sm text-muted-foreground">
            Manage payment plans, track payments, and view financial summary.
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Gói thanh toán</TabsTrigger>
          {canManage && <TabsTrigger value="payments">Payments</TabsTrigger>}
          {canManage && <TabsTrigger value="summary">Tổng hợp tài chính</TabsTrigger>}
        </TabsList>

        <TabsContent value="plans" className="space-y-4 mt-4">
          {canManage && (
            <div className="flex justify-end">
              <PaymentPlanForm tournamentId={tournamentId} />
            </div>
          )}

          {plans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment plans"
              description="Create a payment plan to start collecting fees."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map(
                (plan: {
                  id: string;
                  name: string;
                  amount: number;
                  perTeam: boolean;
                  earlyBirdAmount: number | null;
                  earlyBirdDeadline: string | null;
                  createdAt: string;
                }) => (
                  <Card key={plan.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {plan.name}
                        {plan.perTeam && (
                          <Badge variant="outline" className="text-[10px]">
                            Per Team
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-2xl font-bold">{formatVND(plan.amount)}</p>
                      {plan.earlyBirdAmount && plan.earlyBirdDeadline && (
                        <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-2">
                          <p className="text-xs text-green-700 dark:text-green-400">
                            Early bird: {formatVND(plan.earlyBirdAmount)} until{' '}
                            {formatDate(plan.earlyBirdDeadline)}
                          </p>
                        </div>
                      )}
                      {!canManage && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan({ id: plan.id, amount: plan.amount });
                            setPayDialogOpen(true);
                          }}
                        >
                          Thanh toán
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {canManage && (
          <TabsContent value="payments" className="mt-4">
            <PaymentTable
              payments={payments}
              isLoading={paymentsLoading}
              showRefund
              onRefunded={() => refetchPayments()}
              onConfirmed={() => refetchPayments()}
            />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="summary" className="mt-4">
            <FinancialSummary tournamentId={tournamentId} />
          </TabsContent>
        )}
      </Tabs>

      {selectedPlan && (
        <PaymentDialog
          open={payDialogOpen}
          onOpenChange={setPayDialogOpen}
          paymentPlanId={selectedPlan.id}
          teamId={myTeam?.id ?? ''}
          tournamentId={tournamentId}
          amount={selectedPlan.amount}
        />
      )}
    </div>
  );
}
