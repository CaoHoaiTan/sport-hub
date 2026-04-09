'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { CreditCard, Pencil, Trash2, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer, isAdmin } from '@/lib/utils/roles';
import { formatVND, formatDate } from '@/lib/utils/format';
import {
  GET_PAYMENT_PLANS,
  GET_PAYMENTS_BY_TOURNAMENT,
} from '@/graphql/queries/payment';
import { DELETE_PAYMENT_PLAN } from '@/graphql/mutations/payment';
import { GET_TEAMS_BY_TOURNAMENT } from '@/graphql/queries/team';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { toast } from 'sonner';
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
  DialogDescription as ConfirmDialogDescription,
  DialogFooter as ConfirmDialogFooter,
} from '@/components/ui/dialog';
import { PaymentPlanForm } from '@/components/payment/payment-plan-form';
import { PaymentPlanEditDialog } from '@/components/payment/payment-plan-edit-dialog';
import { PromoCodeForm } from '@/components/payment/promo-code-form';
import { PaymentTable } from '@/components/payment/payment-table';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import { FinancialSummary } from '@/components/payment/financial-summary';

export default function PaymentsPage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<{
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
  } | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
    earlyBirdAmount?: number | null;
    earlyBirdDeadline?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    transferContent?: string | null;
  } | null>(null);

  const [deletePlan, { loading: deleting }] = useMutation(DELETE_PAYMENT_PLAN, {
    refetchQueries: [{ query: GET_PAYMENT_PLANS, variables: { tournamentId } }],
  });

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
  const payments: Array<{ id: string; paymentPlanId: string; status: string; amount: number }> =
    paymentsData?.paymentsByTournament ?? [];

  // Per-plan payment stats
  function getPlanStats(planId: string) {
    const planPayments = payments.filter((p) => p.paymentPlanId === planId);
    const paid = planPayments.filter((p) => p.status === 'paid');
    const pending = planPayments.filter((p) => p.status === 'pending' || p.status === 'overdue');
    return {
      total: planPayments.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      paidAmount: paid.reduce((sum, p) => sum + p.amount, 0),
    };
  }

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
          <h2 className="text-lg font-semibold">Thanh toán</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý gói thanh toán, theo dõi giao dịch và xem tổng hợp tài chính.
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Gói thanh toán</TabsTrigger>
          {canManage && <TabsTrigger value="payments">Giao dịch</TabsTrigger>}
          {canManage && <TabsTrigger value="promos">Mã giảm giá</TabsTrigger>}
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
              title="Chưa có gói thanh toán"
              description="Tạo gói thanh toán để bắt đầu thu phí."
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
                  bankName: string | null;
                  bankAccountNumber: string | null;
                  bankAccountHolder: string | null;
                  transferContent: string | null;
                  createdAt: string;
                }) => (
                  <Card key={plan.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {plan.name}
                        {plan.perTeam && (
                          <Badge variant="outline" className="text-[10px]">
                            Theo đội
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
                      {canManage && (() => {
                        const stats = getPlanStats(plan.id);
                        return stats.total > 0 ? (
                          <div className="rounded-md bg-muted/50 p-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Đã thanh toán</span>
                              <span className="font-medium text-green-600">{stats.paidCount}/{stats.total} đội</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Thu được</span>
                              <span className="font-medium">{formatVND(stats.paidAmount)}</span>
                            </div>
                            {stats.pendingCount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Chờ xử lý</span>
                                <span className="font-medium text-yellow-600">{stats.pendingCount} đội</span>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                      {plan.bankAccountNumber && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>{plan.bankName} - {plan.bankAccountNumber}</p>
                          {plan.bankAccountHolder && <p>Chủ TK: {plan.bankAccountHolder}</p>}
                        </div>
                      )}
                      {canManage && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditPlan(plan)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletePlanId(plan.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {!canManage && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan({
                              id: plan.id,
                              amount: plan.amount,
                              earlyBirdAmount: plan.earlyBirdAmount,
                              earlyBirdDeadline: plan.earlyBirdDeadline,
                              bankName: plan.bankName,
                              bankAccountNumber: plan.bankAccountNumber,
                              bankAccountHolder: plan.bankAccountHolder,
                              transferContent: plan.transferContent,
                            });
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
          <TabsContent value="promos" className="mt-4">
            <PromoCodeForm tournamentId={tournamentId} />
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
          earlyBirdAmount={selectedPlan.earlyBirdAmount}
          earlyBirdDeadline={selectedPlan.earlyBirdDeadline}
          bankInfo={selectedPlan}
        />
      )}

      {editPlan && (
        <PaymentPlanEditDialog
          open={!!editPlan}
          onOpenChange={(open) => { if (!open) setEditPlan(null); }}
          tournamentId={tournamentId}
          plan={editPlan}
        />
      )}

      <ConfirmDialog open={!!deletePlanId} onOpenChange={(open) => { if (!open) setDeletePlanId(null); }}>
        <ConfirmDialogContent>
          <ConfirmDialogHeader>
            <ConfirmDialogTitle>Xóa gói thanh toán?</ConfirmDialogTitle>
            <ConfirmDialogDescription>
              Hành động này không thể hoàn tác. Gói thanh toán sẽ bị xóa vĩnh viễn.
            </ConfirmDialogDescription>
          </ConfirmDialogHeader>
          <ConfirmDialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                try {
                  await deletePlan({ variables: { id: deletePlanId } });
                  toast.success('Đã xóa gói thanh toán.');
                  setDeletePlanId(null);
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Xóa thất bại';
                  toast.error(message);
                }
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </ConfirmDialogFooter>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </div>
  );
}
