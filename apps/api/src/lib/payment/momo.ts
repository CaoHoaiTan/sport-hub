import crypto from 'node:crypto';
import { logger } from '../logger.js';

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

function getConfig() {
  return {
    partnerCode: process.env.MOMO_PARTNER_CODE ?? '',
    accessKey: process.env.MOMO_ACCESS_KEY ?? '',
    secretKey: process.env.MOMO_SECRET_KEY ?? '',
    endpoint: process.env.MOMO_ENDPOINT ?? 'https://test-payment.momo.vn/v2/gateway/api/create',
    storeId: process.env.MOMO_STORE_ID ?? 'SportHub',
    storeName: process.env.MOMO_STORE_NAME ?? 'SportHub',
  };
}

function buildSignature(fields: Record<string, string | number>, secretKey: string): string {
  const sorted = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('&');
  return crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');
}

export async function createPayment(params: MomoPaymentParams): Promise<MomoPaymentResult> {
  const cfg = getConfig();
  const requestId = params.orderId;
  const amount = Math.round(params.amount);

  const signatureFields = {
    accessKey: cfg.accessKey,
    amount,
    extraData: '',
    ipnUrl: params.notifyUrl,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    partnerCode: cfg.partnerCode,
    redirectUrl: params.returnUrl,
    requestId,
    requestType: 'captureWallet',
  };

  const signature = buildSignature(signatureFields, cfg.secretKey);

  const body = {
    partnerCode: cfg.partnerCode,
    partnerName: cfg.storeName,
    storeId: cfg.storeId,
    requestType: 'captureWallet',
    ipnUrl: params.notifyUrl,
    redirectUrl: params.returnUrl,
    orderId: params.orderId,
    amount,
    lang: 'vi',
    orderInfo: params.orderInfo,
    requestId,
    extraData: '',
    orderGroupId: '',
    autoCapture: true,
    signature,
  };

  const rawSig = Object.keys(signatureFields)
    .sort()
    .map((k) => `${k}=${(signatureFields as Record<string, unknown>)[k]}`)
    .join('&');

  logger.info({ orderId: params.orderId, amount, partnerCode: cfg.partnerCode, rawSig }, '[MoMo] Sending request');

  const response = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as {
    resultCode: number;
    message: string;
    payUrl?: string;
    requestId?: string;
  };

  logger.info({ orderId: params.orderId, resultCode: result.resultCode, message: result.message }, '[MoMo] Response');

  if (result.resultCode !== 0 || !result.payUrl) {
    throw new Error(`MoMo error ${result.resultCode}: ${result.message}`);
  }

  return { paymentUrl: result.payUrl, transactionId: requestId };
}

export function verifyCallback(params: Record<string, string>): boolean {
  const cfg = getConfig();
  const signatureFields: Record<string, string> = {
    accessKey: cfg.accessKey,
    amount: params.amount,
    extraData: params.extraData ?? '',
    message: params.message,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    orderType: params.orderType,
    partnerCode: params.partnerCode,
    payType: params.payType,
    requestId: params.requestId,
    responseTime: params.responseTime,
    resultCode: params.resultCode,
    transId: params.transId,
  };

  const sorted = Object.keys(signatureFields)
    .sort()
    .map((k) => `${k}=${signatureFields[k]}`)
    .join('&');

  const expected = crypto.createHmac('sha256', cfg.secretKey).update(sorted).digest('hex');
  return expected === params.signature;
}

export async function refund(transactionId: string, amount: number): Promise<boolean> {
  logger.info({ transactionId, amount }, '[MoMo] Refund not implemented');
  return true;
}
