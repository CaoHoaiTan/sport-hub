import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 data URL.
 */
export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
