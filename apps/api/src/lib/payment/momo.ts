import crypto from 'node:crypto';
import { logger } from '../logger.js';

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE ?? '';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY ?? '';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY ?? '';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT ?? 'https://test-payment.momo.vn/v2/gateway/api/create';

interface MomoPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
  notifyUrl: string;
}

interface MomoPaymentResult {
  paymentUrl: string;
  transactionId: string;
}

/**
 * Create a MoMo payment request.
 * Placeholder implementation — requires real API keys to function.
 */
export async function createPayment(params: MomoPaymentParams): Promise<MomoPaymentResult> {
  const requestId = params.orderId;
  const rawSignature = [
    `accessKey=${MOMO_ACCESS_KEY}`,
    `amount=${params.amount}`,
    `extraData=`,
    `ipnUrl=${params.notifyUrl}`,
    `orderId=${params.orderId}`,
    `orderInfo=${params.orderInfo}`,
    `partnerCode=${MOMO_PARTNER_CODE}`,
    `redirectUrl=${params.returnUrl}`,
    `requestId=${requestId}`,
    `requestType=payWithMethod`,
  ].join('&');

  const signature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  logger.info(
    { orderId: params.orderId, signature: signature.substring(0, 10) + '...' },
    '[MoMo] Payment request created (placeholder)'
  );

  // In production, send HTTP POST to MOMO_ENDPOINT with the signed body
  return {
    paymentUrl: `${MOMO_ENDPOINT}?orderId=${params.orderId}`,
    transactionId: requestId,
  };
}

/**
 * Verify a MoMo callback signature.
 */
export function verifyCallback(params: Record<string, string>): boolean {
  const rawSignature = [
    `accessKey=${MOMO_ACCESS_KEY}`,
    `amount=${params.amount}`,
    `extraData=${params.extraData ?? ''}`,
    `message=${params.message}`,
    `orderId=${params.orderId}`,
    `orderInfo=${params.orderInfo}`,
    `orderType=${params.orderType}`,
    `partnerCode=${params.partnerCode}`,
    `payType=${params.payType}`,
    `requestId=${params.requestId}`,
    `responseTime=${params.responseTime}`,
    `resultCode=${params.resultCode}`,
    `transId=${params.transId}`,
  ].join('&');

  const expectedSignature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  return expectedSignature === params.signature;
}

/**
 * Refund a MoMo payment (placeholder).
 */
export async function refund(transactionId: string, amount: number): Promise<boolean> {
  logger.info({ transactionId, amount }, '[MoMo] Refund requested (placeholder)');
  return true;
}
