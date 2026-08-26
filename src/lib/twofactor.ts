const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY || '03a509ca-a183-11f1-9cb1-0200cd936042';

export interface TwoFactorSendResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface TwoFactorVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Send an OTP via 2Factor.in SMS Gateway
 * @param phoneNumber 10-digit mobile number or standard international number
 */
export async function sendTwoFactorOtp(phoneNumber: string): Promise<TwoFactorSendResult> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${cleanPhone}/AUTOGEN`;

    console.log(`[2Factor] Sending OTP to mobile: ${cleanPhone}`);
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.Status === 'Success') {
      console.log(`[2Factor] OTP sent successfully, session ID: ${data.Details}`);
      return {
        success: true,
        sessionId: data.Details,
      };
    } else {
      console.error('[2Factor] Send OTP failed:', data);
      return {
        success: false,
        error: data.Details || 'Failed to dispatch SMS OTP.',
      };
    }
  } catch (err: any) {
    console.error('[2Factor] Send OTP Network Error:', err);
    return {
      success: false,
      error: 'Failed to connect to 2Factor SMS service. Please try again.',
    };
  }
}

/**
 * Verify OTP code against 2Factor.in session
 * @param sessionId The session ID returned from sendTwoFactorOtp
 * @param otpCode The 6-digit or 4-digit OTP entered by the user
 */
export async function verifyTwoFactorOtp(sessionId: string, otpCode: string): Promise<TwoFactorVerifyResult> {
  try {
    const cleanOtp = otpCode.trim();
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

    console.log(`[2Factor] Verifying OTP session: ${sessionId}`);
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
      console.log('[2Factor] OTP Matched successfully');
      return { success: true };
    } else {
      console.warn('[2Factor] OTP verification rejected:', data);
      return {
        success: false,
        error: data.Details || 'Incorrect or expired OTP code.',
      };
    }
  } catch (err: any) {
    console.error('[2Factor] Verify OTP Network Error:', err);
    return {
      success: false,
      error: 'Failed to verify OTP with SMS gateway.',
    };
  }
}
