import crypto from 'node:crypto';
import { logger } from '../logger.js';

function getConfig() {
  const tmnCode = process.env.VNPAY_TMN_CODE ?? '';
  const hashSecret = process.env.VNPAY_HASH_SECRET ?? '';

  if (!tmnCode || tmnCode === 'xxx') {
    throw new Error('VNPAY_TMN_CODE is not configured. Set it in .env');
  }
  if (!hashSecret || hashSecret === 'xxx') {
    throw new Error('VNPAY_HASH_SECRET is not configured. Set it in .env');
  }

  return {
    tmnCode,
    hashSecret,
    url: process.env.VNPAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  };
}

interface VnPayParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
}

/** Normalize IPv6 loopback / mapped addresses to IPv4 */
function normalizeIp(ip: string): string {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

export function createPaymentUrl(params: VnPayParams): string {
  const cfg = getConfig();

  // VNPay requires date in Asia/Ho_Chi_Minh timezone: YYYYMMDDHHmmss
  const now = new Date();
  const vnDateStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const createDate = vnDateStr.replace(/[-: T]/g, '').substring(0, 14);

  const ipAddr = normalizeIp(params.ipAddr);

  // Sanitize orderInfo to ASCII-safe characters (VNPay does not encode query values)
  const safeOrderInfo = params.orderInfo.replace(/[^a-zA-Z0-9 ._-]/g, '');

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: cfg.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: safeOrderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(params.amount) * 100),
    vnp_ReturnUrl: params.returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  // VNPay official approach: sign and build URL with the same unencoded query string
  const sortedKeys = Object.keys(vnpParams).sort();
  const signData = sortedKeys.map((k) => `${k}=${vnpParams[k]}`).join('&');
  const signature = crypto
    .createHmac('sha512', cfg.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const paymentUrl = `${cfg.url}?${signData}&vnp_SecureHash=${signature}`;

  logger.info(
    {
      orderId: params.orderId,
      amount: vnpParams.vnp_Amount,
      tmnCode: cfg.tmnCode,
      ipAddr,
      createDate,
      returnUrl: params.returnUrl,
      signaturePrefix: signature.substring(0, 16) + '...',
    },
    '[VNPay] Payment URL created'
  );

  return paymentUrl;
}

export function verifyReturnUrl(query: Record<string, string>): { valid: boolean; resultCode: string } {
  const cfg = getConfig();
  const secureHash = query.vnp_SecureHash;
  if (!secureHash) return { valid: false, resultCode: '97' };

  // Keep only vnp_* params for signature (exclude non-VNPay params and hash itself)
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith('vnp_') && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') {
      params[k] = v;
    }
  }

  const signData = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const expectedHash = crypto
    .createHmac('sha512', cfg.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  logger.info(
    {
      expectedHash: expectedHash.substring(0, 20) + '...',
      receivedHash: secureHash.substring(0, 20) + '...',
      match: expectedHash === secureHash,
    },
    '[VNPay] Signature verification'
  );

  const valid = expectedHash === secureHash;
  const resultCode = query.vnp_ResponseCode ?? '99';

  return { valid, resultCode };
}
