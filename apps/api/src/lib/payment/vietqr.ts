import { generateQrDataUrl } from '../qr.js';
import { logger } from '../logger.js';

interface VietQrParams {
  bankBin: string;
  accountNumber: string;
  amount: number;
  description: string;
}

/**
 * Generate a VietQR bank transfer QR code (placeholder).
 * Uses the VietQR URL format for quick transfer encoding.
 */
export async function generateQR(params: VietQrParams): Promise<string> {
  const qrContent = [
    `bank:${params.bankBin}`,
    `acc:${params.accountNumber}`,
    `amount:${params.amount}`,
    `desc:${params.description}`,
  ].join('|');

  logger.info(
    { bankBin: params.bankBin, amount: params.amount },
    '[VietQR] QR code generated (placeholder)'
  );

  return generateQrDataUrl(qrContent);
}
