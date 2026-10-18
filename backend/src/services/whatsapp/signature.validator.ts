import crypto from 'crypto';

export function computeSignature(payloadBuffer: Buffer, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBuffer);
  return `sha256=${hmac.digest('hex')}`;
}

export function verifyMetaSignature(
  signatureHeader: string | undefined,
  rawBody: Buffer | undefined,
  appSecret: string
): { isValid: boolean; error?: string } {
  if (!signatureHeader) {
    return { isValid: false, error: 'Missing X-Hub-Signature-256 header' };
  }

  if (!rawBody || rawBody.length === 0) {
    return { isValid: false, error: 'Missing raw request body buffer' };
  }

  if (!appSecret) {
    return { isValid: false, error: 'Meta App Secret is not configured' };
  }

  const expectedSignature = computeSignature(rawBody, appSecret);

  // Timing safe equality comparison
  const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { isValid: false, error: 'Signature length mismatch' };
  }

  const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  return {
    isValid,
    error: isValid ? undefined : 'Invalid signature: digest did not match expected HMAC',
  };
}
