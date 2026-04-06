import crypto from 'node:crypto';
import { logger } from '../logger.js';

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE ?? '';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET ?? '';
const VNPAY_URL = process.env.VNPAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

interface VnPayParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
}

/**
 * Create a VNPay payment URL.
 * Placeholder implementation — requires real API keys.
 */
export function createPaymentUrl(params: VnPayParams): string {
  const date = new Date();
  const createDate = date.toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(params.amount * 100),
    vnp_ReturnUrl: params.returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
  };

  const sortedKeys = Object.keys(vnpParams).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(vnpParams[key])}`)
    .join('&');

  const hmac = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(queryString)
    .digest('hex');

  const paymentUrl = `${VNPAY_URL}?${queryString}&vnp_SecureHash=${hmac}`;

  logger.info(
    { orderId: params.orderId },
    '[VNPay] Payment URL created (placeholder)'
  );

  return paymentUrl;
}

/**
 * Verify a VNPay return URL signature.
 */
export function verifyReturnUrl(query: Record<string, string>): boolean {
  const secureHash = query.vnp_SecureHash;
  if (!secureHash) return false;

  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedKeys = Object.keys(params).sort();
  const signData = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const expectedHash = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(signData)
    .digest('hex');

  return expectedHash === secureHash;
}
