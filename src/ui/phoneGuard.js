import { auth } from "../auth/firebase.js";
import { sendOtp, verifyOtpAndLink } from "../auth/auth.js";
import { submitForm } from "../api/api.js";

let savedServiceUrl = "";
let otpConfirmationResult = null;
let savedPhoneValue = "";

/**
 * Injects the Phone Verification Modal markup if not already present.
 */
function initPhoneGuardModal() {
  if (document.getElementById("citadyo-phone-guard-modal")) return;

  const modalHtml = `
    <div id="citadyo-phone-guard-modal" class="citadyo-modal-overlay">
      <div class="citadyo-modal-content glass" style="max-width: 440px;">
        <button class="citadyo-modal-close" id="phone-guard-close-btn" aria-label="Close modal">&times;</button>
        
        <!-- Screen 1: Request Phone Number -->
        <div class="phone-guard-step active" id="phone-step-request">
          <div class="auth-header">
            <div class="auth-logo-container" style="background: rgba(20, 184, 166, 0.08);">
              <span style="font-size: 1.5rem;">🚀</span>
            </div>
            <h2 style="font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.75rem;">One last step 🚀</h2>
            <p class="auth-subtitle" style="font-size: 0.925rem; line-height: 1.5; color: var(--text-secondary);">
              Before we continue, please verify your phone number so our team can coordinate your service and keep you updated.
            </p>
          </div>
          <form id="phone-guard-request-form">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label for="guard-phone" style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.5rem;">Phone Number</label>
              <div class="phone-input-wrapper">
                <span class="country-code">+91</span>
                <input type="tel" id="guard-phone" placeholder="Enter 10-digit number" required pattern="[0-9]{10}" maxlength="10">
              </div>
            </div>
            <button type="submit" class="btn-primary auth-btn" id="guard-send-otp-btn" style="width:100%; border-radius:10px; height:46px;">
              Continue
            </button>
          </form>
          <div id="phone-guard-request-error" class="auth-error"></div>
          <div id="phone-guard-recaptcha-container" style="margin-top: 10px; display: flex; justify-content: center;"></div>
        </div>

        <!-- Screen 2: OTP Code Verification -->
        <div class="phone-guard-step" id="phone-step-verify">
          <div class="auth-header">
            <div class="auth-logo-container" style="background: rgba(20, 184, 166, 0.08);">
              <span style="font-size: 1.5rem;">📱</span>
            </div>
            <h2 style="font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.75rem;">Verify OTP 📱</h2>
            <p class="auth-subtitle" id="guard-otp-subtitle" style="font-size: 0.9rem; color: var(--text-secondary);"></p>
          </div>
          <form id="phone-guard-verify-form">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label for="guard-otp-code" style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.5rem;">Verification Code</label>
              <input type="text" id="guard-otp-code" class="otp-input" placeholder="000000" maxlength="6" pattern="[0-9]{6}" required>
            </div>
            <button type="submit" class="btn-primary auth-btn" id="guard-verify-otp-btn" style="width:100%; border-radius:10px; height:46px;">
              Verify & Continue
            </button>
            <button type="button" class="btn-secondary-link" id="guard-otp-back-btn" style="margin-top: 1rem;">
              Back
            </button>
          </form>
          <div id="phone-guard-verify-error" class="auth-error"></div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Modal actions
  const modal = document.getElementById("citadyo-phone-guard-modal");
  const closeBtn = document.getElementById("phone-guard-close-btn");
  const requestForm = document.getElementById("phone-guard-request-form");
  const verifyForm = document.getElementById("phone-guard-verify-form");
  const backBtn = document.getElementById("guard-otp-back-btn");

  closeBtn.addEventListener("click", closePhoneGuardModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePhoneGuardModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closePhoneGuardModal();
    }
  });

  // Back action
  backBtn.addEventListener("click", () => {
    const recaptchaContainer = document.getElementById("phone-guard-recaptcha-container");
    if (recaptchaContainer) recaptchaContainer.innerHTML = "";
    switchGuardStep("request");
  });

  // Request form submit
  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("phone-guard-request-error");
    const sendBtn = document.getElementById("guard-send-otp-btn");
    errorEl.textContent = "";

    const rawPhone = document.getElementById("guard-phone").value.trim();
    if (!rawPhone || rawPhone.length !== 10) {
      errorEl.textContent = "Please enter a valid 10-digit phone number.";
      return;
    }

    savedPhoneValue = `+91${rawPhone}`;

    sendBtn.disabled = true;
    const originalText = sendBtn.textContent;
    sendBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" width="18" height="18" style="margin-right: 8px;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle>
      </svg>
      Sending...
    `;

    try {
      otpConfirmationResult = await sendOtp(savedPhoneValue, "phone-guard-recaptcha-container");
      document.getElementById("guard-otp-subtitle").textContent = `Enter the 6-digit verification code sent to ${savedPhoneValue}`;
      switchGuardStep("verify");
    } catch (err) {
      console.error(err);
      errorEl.textContent = err.message || "Failed to send OTP code. Please check your phone number and try again.";
      const container = document.getElementById("phone-guard-recaptcha-container");
      if (container) container.innerHTML = "";
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = originalText;
    }
  });

  // Verify form submit
  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("phone-guard-verify-error");
    const verifyBtn = document.getElementById("guard-verify-otp-btn");
    errorEl.textContent = "";

    const code = document.getElementById("guard-otp-code").value.trim();
    if (!code || code.length !== 6) {
      errorEl.textContent = "Please enter a valid 6-digit OTP code.";
      return;
    }

    if (!otpConfirmationResult) {
      errorEl.textContent = "Session expired. Please click back and try again.";
      return;
    }

    verifyBtn.disabled = true;
    const originalText = verifyBtn.textContent;
    verifyBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" width="18" height="18" style="margin-right: 8px;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle>
      </svg>
      Verifying...
    `;

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated session found.");

      // Link credentials in Firebase auth
      await verifyOtpAndLink(otpConfirmationResult, code);

      verifyBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 50 50" width="18" height="18" style="margin-right: 8px;">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle>
        </svg>
        Registering...
      `;

      // Update phone verification values in Google Sheets
      await submitForm('updatePhone', {
        uid: firebaseUser.uid,
        phone: savedPhoneValue,
        phoneVerified: true,
        verifiedAt: new Date().toISOString()
      });

      // Clear states and navigate
      closePhoneGuardModal();
      window.location.href = savedServiceUrl;

    } catch (err) {
      console.error(err);
      if (err.code === "auth/credential-already-in-use") {
        errorEl.textContent = "This phone number is already verified and linked with another Citadyo account.";
      } else {
        errorEl.textContent = err.message || "Invalid verification code. Please try again.";
      }
      verifyBtn.disabled = false;
      verifyBtn.textContent = originalText;
    }
  });
}

function switchGuardStep(step) {
  const steps = document.querySelectorAll(".phone-guard-step");
  steps.forEach(s => s.classList.remove("active"));
  
  const target = document.getElementById(`phone-step-${step}`);
  if (target) target.classList.add("active");
}

function closePhoneGuardModal() {
  const modal = document.getElementById("citadyo-phone-guard-modal");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "";
}

/**
 * Global Verification Guard Interceptor.
 * Checks sheet backend for PhoneVerified boolean. Redirects or shows Modal.
 * 
 * @param {string} serviceUrl - Page location to open after phone status check
 */
export async function requirePhoneVerification(serviceUrl) {
  savedServiceUrl = serviceUrl;
  
  // Setup modal DOM elements
  initPhoneGuardModal();
  switchGuardStep("request");

  const firebaseUser = auth.currentUser;
  
  // If not logged in at all, allow navigation to let the public form show or handle it
  if (!firebaseUser) {
    window.location.href = serviceUrl;
    return;
  }

  // Show a loading cursor/state if query takes a bit
  document.body.style.cursor = "wait";

  try {
    const userRow = await submitForm('getUser', { uid: firebaseUser.uid });
    
    // Check if phone number is verified in Google Sheets database
    const isVerified = userRow.exists && (
      userRow.user.PhoneVerified === true ||
      String(userRow.user.PhoneVerified).toLowerCase() === "true" ||
      String(userRow.user.PhoneVerified).toLowerCase() === "yes"
    );

    document.body.style.cursor = "";

    if (isVerified) {
      // User is verified! Navigate straight to the service
      window.location.href = serviceUrl;
    } else {
      // Not verified: Reset state indicators and open the Verification modal
      const errorRequest = document.getElementById("phone-guard-request-error");
      const errorVerify = document.getElementById("phone-guard-verify-error");
      const requestForm = document.getElementById("phone-guard-request-form");
      const verifyForm = document.getElementById("phone-guard-verify-form");
      const container = document.getElementById("phone-guard-recaptcha-container");

      if (errorRequest) errorRequest.textContent = "";
      if (errorVerify) errorVerify.textContent = "";
      if (requestForm) requestForm.reset();
      if (verifyForm) verifyForm.reset();
      if (container) container.innerHTML = "";

      const modal = document.getElementById("citadyo-phone-guard-modal");
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  } catch (err) {
    console.error("Failed to check phone verification state:", err);
    document.body.style.cursor = "";
    // If backend connection fails, let them proceed to the service page as fallback
    window.location.href = serviceUrl;
  }
}
