import { 
  loginWithGoogle, 
  checkUserExists 
} from "../auth/auth.js";
import { submitForm } from "../api/api.js";

/**
 * Injects the Auth Modal markup into the document body if it doesn't already exist.
 */
export function initAuthModal() {
  if (document.getElementById("citadyo-auth-modal")) return;

  const modalHtml = `
    <div id="citadyo-auth-modal" class="citadyo-modal-overlay">
      <div class="citadyo-modal-content glass">
        <button class="citadyo-modal-close" id="citadyo-modal-close-btn" aria-label="Close modal">&times;</button>
        
        <!-- Screen 1: Welcome -->
        <div class="auth-step active" id="auth-step-welcome">
          <div class="auth-header">
            <div class="auth-logo-container">
              <img src="/logo.png" class="auth-logo" alt="Citadyo Logo" />
            </div>
            <h2>Welcome to Citadyo 💙</h2>
            <p class="auth-subtitle">Your city-settling companion.</p>
          </div>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">✨</span>
              <span>Arrival Assistance</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🏠</span>
              <span>Accommodation Support</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎓</span>
              <span>Local Seniors</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📦</span>
              <span>Relocation Kits</span>
            </div>
          </div>
          <button class="btn-primary auth-btn google-btn" id="google-login-btn">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.45 7.5l3.8 2.95C6.18 7.39 8.87 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.74-4.87 3.74-8.45z"/>
              <path fill="#FBBC05" d="M5.25 14.55c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.45 7.02C.52 8.87 0 10.97 0 13.15s.52 4.28 1.45 6.13l3.8-2.95c-.24-.72-.38-1.49-.38-2.29z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.63-2.82c-1.01.68-2.3 1.09-3.8 1.09-3.13 0-5.82-2.35-6.75-5.41L1.45 15.82C3.37 20.35 7.35 23 12 23z"/>
            </svg>
            Continue with Google
          </button>
          <div id="welcome-error" class="auth-error"></div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Set up event listeners
  const modal = document.getElementById("citadyo-auth-modal");
  const closeBtn = document.getElementById("citadyo-modal-close-btn");
  const googleBtn = document.getElementById("google-login-btn");

  // Close modal click handlers
  closeBtn.addEventListener("click", closeAuthModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAuthModal();
  });

  // Esc key listener
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeAuthModal();
    }
  });

  // Google Sign In
  googleBtn.addEventListener("click", async () => {
    const errorEl = document.getElementById("welcome-error");
    errorEl.textContent = "";
    googleBtn.disabled = true;
    googleBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" width="18" height="18" style="margin-right: 8px;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle>
      </svg>
      Connecting...
    `;

    try {
      const user = await loginWithGoogle();

      // Check if user is already in Google Sheets backend
      const exists = await checkUserExists(user.uid);
      if (exists) {
        // Logged in before, redirect directly
        closeAuthModal();
        window.location.href = "/dashboard.html";
      } else {
        // First login, register profile in Google Sheets immediately
        googleBtn.innerHTML = `
          <svg class="spinner" viewBox="0 0 50 50" width="18" height="18" style="margin-right: 8px;">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle>
          </svg>
          Registering...
        `;

        await submitForm('users', {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phone: "",
          destination_city: "",
          user_type: "",
          created_at: new Date().toISOString(),
          status: "Active",
          profile_complete: true
        });

        closeAuthModal();
        window.location.href = "/dashboard.html";
      }
    } catch (err) {
      console.error(err);
      errorEl.textContent = err.message || "Google Sign-In failed. Please try again.";
      googleBtn.disabled = false;
      googleBtn.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.45 7.5l3.8 2.95C6.18 7.39 8.87 5.04 12 5.04z"/>
          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.74-4.87 3.74-8.45z"/>
          <path fill="#FBBC05" d="M5.25 14.55c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.45 7.02C.52 8.87 0 10.97 0 13.15s.52 4.28 1.45 6.13l3.8-2.95c-.24-.72-.38-1.49-.38-2.29z"/>
          <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.63-2.82c-1.01.68-2.3 1.09-3.8 1.09-3.13 0-5.82-2.35-6.75-5.41L1.45 15.82C3.37 20.35 7.35 23 12 23z"/>
        </svg>
        Continue with Google
      `;
    }
  });
}

/**
 * Opens the authentication modal.
 */
export function openAuthModal() {
  initAuthModal();
  
  const googleBtn = document.getElementById("google-login-btn");
  if (googleBtn) {
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.45 7.5l3.8 2.95C6.18 7.39 8.87 5.04 12 5.04z"/>
        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.74-4.87 3.74-8.45z"/>
        <path fill="#FBBC05" d="M5.25 14.55c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.45 7.02C.52 8.87 0 10.97 0 13.15s.52 4.28 1.45 6.13l3.8-2.95c-.24-.72-.38-1.49-.38-2.29z"/>
        <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.63-2.82c-1.01.68-2.3 1.09-3.8 1.09-3.13 0-5.82-2.35-6.75-5.41L1.45 15.82C3.37 20.35 7.35 23 12 23z"/>
      </svg>
      Continue with Google
    `;
  }

  const welcomeError = document.getElementById("welcome-error");
  if (welcomeError) welcomeError.textContent = "";

  const modal = document.getElementById("citadyo-auth-modal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Closes the authentication modal.
 */
export function closeAuthModal() {
  const modal = document.getElementById("citadyo-auth-modal");
  if (modal) {
    modal.classList.remove("active");
  }
  document.body.style.overflow = "";
}
