import express, { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '@sporthub/db';
import { verifyCallback as verifyMomoCallback } from '../lib/payment/momo.js';
import { verifyReturnUrl as verifyVnPayReturn } from '../lib/payment/vnpay.js';
import { logger } from '../lib/logger.js';

function getFrontendUrl() {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

async function markPaymentPaid(
  db: Kysely<Database>,
  paymentId: string,
  transactionId: string,
  gatewayResponse: Record<string, unknown>,
  expectedAmountInCents?: number
): Promise<boolean> {
  const payment = await db
    .selectFrom('payments')
    .select(['id', 'status', 'amount'])
    .where('id', '=', paymentId)
    .executeTakeFirst();

  if (!payment || payment.status === 'paid') return false;

  // Verify amount matches if provided (VNPay uses amount * 100)
  if (expectedAmountInCents != null) {
    const dbAmountInCents = Math.round(parseFloat(payment.amount) * 100);
    if (expectedAmountInCents !== dbAmountInCents) {
      logger.error(
        { paymentId, expected: expectedAmountInCents, actual: dbAmountInCents },
        '[Payment] Amount mismatch — possible fraud attempt'
      );
      return false;
    }
  }

  await db
    .updateTable('payments')
    .set({
      status: 'paid',
      transaction_id: transactionId,
      gateway_response: gatewayResponse,
      paid_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', paymentId)
    .execute();

  return true;
}

async function getTournamentIdForPayment(db: Kysely<Database>, paymentId: string): Promise<string> {
  const row = await db
    .selectFrom('payments')
    .innerJoin('payment_plans', 'payment_plans.id', 'payments.payment_plan_id')
    .select('payment_plans.tournament_id')
    .where('payments.id', '=', paymentId)
    .executeTakeFirst();

  return row?.tournament_id ?? '';
}

export function createPaymentCallbackRouter(db: Kysely<Database>): Router {
  const router = Router();

  /**
   * MoMo IPN (server-to-server): POST /payment/momo-ipn
   */
  router.post('/momo-ipn', express.json(), async (req, res) => {
    const body = req.body as Record<string, string>;
    logger.info({ orderId: body.orderId, resultCode: body.resultCode }, '[MoMo] IPN received');

    if (!verifyMomoCallback(body)) {
      logger.warn({ orderId: body.orderId }, '[MoMo] IPN signature invalid');
      res.status(200).json({ resultCode: 0, message: 'ok' });
      return;
    }

    if (String(body.resultCode) === '0') {
      const updated = await markPaymentPaid(db, body.orderId, body.transId, body as Record<string, unknown>);
      if (updated) logger.info({ orderId: body.orderId }, '[MoMo] Payment marked as paid');
    } else {
      logger.info({ orderId: body.orderId, resultCode: body.resultCode }, '[MoMo] Payment not successful');
    }

    res.status(200).json({ resultCode: 0, message: 'ok' });
  });

  /**
   * VNPay return: GET /payment/vnpay-return
   * VNPay redirects user's browser here after payment.
   */
  router.get('/vnpay-return', async (req, res) => {
    const query = req.query as Record<string, string>;
    const paymentId = query.vnp_TxnRef ?? '';
    const responseCode = query.vnp_ResponseCode ?? '';

    logger.info({ paymentId, responseCode, allParams: Object.keys(query) }, '[VNPay] Return received');

    const { valid, resultCode } = verifyVnPayReturn(query);

    logger.info({ paymentId, valid, resultCode }, '[VNPay] Signature check result');

    const tournamentId = await getTournamentIdForPayment(db, paymentId);

    if (!valid) {
      logger.warn({ paymentId }, '[VNPay] Return signature invalid');
      res.redirect(`${getFrontendUrl()}/payment/result?status=failed&reason=invalid_signature&tournamentId=${tournamentId}`);
      return;
    }

    if (resultCode === '00') {
      const transactionId = query.vnp_TransactionNo ?? '';
      const vnpAmount = parseInt(query.vnp_Amount ?? '0', 10);
      await markPaymentPaid(db, paymentId, transactionId, query as Record<string, unknown>, vnpAmount);
      logger.info({ paymentId }, '[VNPay] Payment marked as paid');
      res.redirect(`${getFrontendUrl()}/payment/result?status=success&paymentId=${paymentId}&tournamentId=${tournamentId}`);
    } else {
      res.redirect(`${getFrontendUrl()}/payment/result?status=failed&reason=payment_failed&code=${resultCode}&tournamentId=${tournamentId}`);
    }
  });

  return router;
}
