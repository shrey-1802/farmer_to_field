/**
 * KrishiNirnay AI - Farmer OTP Login & Verification Controller (Section 66 & 80)
 * Manages mobile validation, 6-box OTP entry, countdown timers, and API integration.
 */

import authManager, { AUTH_STATES } from './auth.js';
import APP_CONFIG from './config.js';

class OtpController {
  constructor() {
    this.init();
  }

  init() {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isVerifyPage = window.location.pathname.includes('verify-otp.html');

    if (isLoginPage) {
      this.initLoginScreen();
    } else if (isVerifyPage) {
      this.initVerifyScreen();
    }
  }

  /**
   * -------------------------------------------------------------------------
   * Login Screen Logic (login.html)
   * -------------------------------------------------------------------------
   */
  initLoginScreen() {
    const form = document.getElementById('login-form');
    const mobileInput = document.getElementById('mobile-input');
    const demoBtn = document.getElementById('demo-login-btn');
    const errorEl = document.getElementById('phone-error');
    const submitBtn = document.getElementById('send-otp-btn');

    if (!form || !mobileInput) return;

    // Demo account one-click bypass
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        authManager.loginWithDemo();
      });
    }

    // Sanitize input to only accept numbers
    mobileInput.addEventListener('input', () => {
      mobileInput.value = mobileInput.value.replace(/\D/g, '').slice(0, 10);
      if (errorEl) errorEl.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = mobileInput.value.trim();

      // Validate Indian mobile number (10 digits starting with 6, 7, 8, 9)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        this.showInputError(errorEl, 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
        return;
      }

      this.setButtonLoading(submitBtn, true, 'Sending OTP...');

      try {
        // Always call backend send-otp (works on localhost & production)
        const res = await fetch(`${APP_CONFIG.API_BASE_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}` })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Failed to send OTP' }));
          throw new Error(err.detail || 'Server error');
        }

        const data = await res.json();

        // Show demo OTP hint if backend returns it (dev/demo mode)
        if (data.demo_code) {
          console.info(`[DEMO] OTP for ${phone}: ${data.demo_code}`);
          // Show a subtle hint banner
          const hintBanner = document.getElementById('demo-otp-hint');
          if (hintBanner) {
            hintBanner.textContent = `Demo OTP: ${data.demo_code}`;
            hintBanner.style.display = 'block';
          }
        }

        // Store pending phone in session storage for verification screen
        sessionStorage.setItem('krishi_pending_phone', phone);
        authManager.currentState = AUTH_STATES.OTP_SENT;

        // Redirect to verify-otp.html
        window.location.href = './verify-otp.html';
      } catch (err) {
        console.warn('API send-otp error, using mock fallback:', err);
        if (APP_CONFIG.ENABLE_MOCK_FALLBACK) {
          sessionStorage.setItem('krishi_pending_phone', phone);
          sessionStorage.setItem('krishi_mock_otp', 'true');
          authManager.currentState = AUTH_STATES.OTP_SENT;
          window.location.href = './verify-otp.html';
        } else {
          this.showInputError(errorEl, err.message || 'Unable to send OTP. Please check your connection.');
        }
      } finally {
        this.setButtonLoading(submitBtn, false, 'Send OTP →');
      }
    });
  }

  /**
   * -------------------------------------------------------------------------
   * Verification Screen Logic (verify-otp.html)
   * -------------------------------------------------------------------------
   */
  initVerifyScreen() {
    const form = document.getElementById('otp-form');
    const displayPhoneEl = document.getElementById('display-phone');
    const resendBtn = document.getElementById('resend-otp-btn');
    const countdownEl = document.getElementById('countdown-seconds');
    const timerText = document.getElementById('timer-text');
    const errorEl = document.getElementById('otp-error');
    const verifyBtn = document.getElementById('verify-btn');
    const otpInputs = document.querySelectorAll('.otp-digit');

    const pendingPhone = sessionStorage.getItem('krishi_pending_phone');
    if (!pendingPhone) {
      window.location.replace('./login.html');
      return;
    }

    // Display masked phone: +91 ••••• 43210
    if (displayPhoneEl) {
      const masked = pendingPhone.length === 10
        ? `+91 ••••• ${pendingPhone.slice(5)}`
        : `+91 ${pendingPhone}`;
      displayPhoneEl.textContent = masked;
    }

    // Setup 6-Box Auto-Advance and Keyboard Navigation
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val[0] : '';
        if (errorEl) errorEl.style.display = 'none';

        // Auto-advance to next box if filled
        if (val && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        // Backspace moves to previous box
        if (e.key === 'Backspace' && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });

      // Handle full 6-digit paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
          pasted.split('').forEach((char, i) => {
            if (otpInputs[i]) otpInputs[i].value = char;
          });
          const nextFocus = Math.min(pasted.length, otpInputs.length - 1);
          otpInputs[nextFocus].focus();
        }
      });
    });

    // Pre-fill demo code 123456 for instant one-click testing
    const demoDigits = ['1', '2', '3', '4', '5', '6'];
    otpInputs.forEach((inp, i) => {
      inp.value = demoDigits[i] || '';
    });

    // Auto-focus last input box so user can press Enter immediately
    if (otpInputs.length > 0) {
      otpInputs[otpInputs.length - 1].focus();
    }

    // 60-Second Resend Countdown Timer
    this.startCountdown(60, countdownEl, resendBtn, timerText);

    resendBtn?.addEventListener('click', async () => {
      this.startCountdown(60, countdownEl, resendBtn, timerText);
      try {
        if (APP_CONFIG.ENV === 'production' && !APP_CONFIG.ENABLE_MOCK_FALLBACK) {
          await fetch(`${APP_CONFIG.API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: `+91${pendingPhone}` })
          });
        }
        alert('A new 6-digit OTP has been dispatched to your mobile.');
      } catch (err) {
        console.warn('Resend failed, simulated fallback active:', err);
      }
    });

    // Submit Verification
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = Array.from(otpInputs).map(inp => inp.value.trim()).join('');

      if (code.length !== 6) {
        this.showInputError(errorEl, 'Please enter the complete 6-digit verification code.');
        return;
      }

      this.setButtonLoading(verifyBtn, true, 'Verifying...');

      try {
        const isMock = sessionStorage.getItem('krishi_mock_otp') === 'true';
        let token, farmer, hasFarm = false, farmId = null;

        if (!isMock) {
          // Real backend verification
          const res = await fetch(`${APP_CONFIG.API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: `+91${pendingPhone}`, code })
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Invalid OTP' }));
            throw new Error(err.detail || 'Invalid verification code');
          }

          const data = await res.json();
          token = data.access_token;
          farmer = data.user || {};
          hasFarm = data.has_farm || false;
          farmId = data.farm_id || null;
        } else {
          // Mock fallback (backend offline)
          token = 'mock-jwt-' + Math.random().toString(36).substring(2);
          farmer = { full_name: `Farmer ${pendingPhone.slice(-4)}`, phone: `+91${pendingPhone}` };
          hasFarm = false;
        }

        // Authentication Success: Store credentials
        authManager.setToken(token);
        authManager.setSession({
          ...farmer,
          mobile: `+91 ${pendingPhone}`,
          farmId,
          loginTime: new Date().toISOString()
        });
        authManager.currentState = AUTH_STATES.AUTHENTICATED;
        sessionStorage.removeItem('krishi_pending_phone');
        sessionStorage.removeItem('krishi_mock_otp');

        // Route: no farm → onboarding, has farm → dashboard
        if (!hasFarm) {
          window.location.replace('./onboarding.html');
        } else {
          window.location.replace('./dashboard.html');
        }
      } catch (err) {
        console.warn('Verification error:', err);
        this.showInputError(errorEl, err.message || 'Invalid or expired OTP. Please try again.');
      } finally {
        this.setButtonLoading(verifyBtn, false, 'Verify & Continue');
      }
    });
  }

  startCountdown(seconds, countdownEl, resendBtn, timerText) {
    let remaining = seconds;
    if (resendBtn) resendBtn.disabled = true;
    if (timerText) timerText.style.display = 'block';

    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (timerText) timerText.style.display = 'none';
      }
    }, 1000);
  }

  showInputError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  setButtonLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    const textSpan = btn.querySelector('.btn-text');
    const loaderSpan = btn.querySelector('.btn-loader');
    if (textSpan) textSpan.textContent = text;
    if (loaderSpan) loaderSpan.style.display = isLoading ? 'inline-block' : 'none';
  }
}

export const otpController = new OtpController();
export default otpController;
