import { listenForAuth, logout } from "./auth/auth.js";
import { initSupport } from "./ui/support.js";

// Reusable Steps Configuration
const DEFAULT_JOURNEY_STEPS = [
  { id: "account", label: "Account Created", completed: true },
  { id: "arrival", label: "Arrival Assistance", completed: false },
  { id: "accommodation", label: "Accommodation", completed: false },
  { id: "kit", label: "Settling Kit", completed: false },
  { id: "settled", label: "Settled In", completed: false }
];

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("dashboard-loader");

  // Initialize Support System
  initSupport();

  // Protect the page using listenForAuth
  listenForAuth((user) => {
    if (!user) {
      // If not logged in, redirect directly to index
      window.location.href = "/";
    } else {
      // User is verified, populate dashboard and hide loader
      populateUserData(user);
      initDashboardInteractions();
      
      // Initial render of the progress tracker (20% progress)
      renderProgress(20, DEFAULT_JOURNEY_STEPS);

      // Hide Loader with fade effect
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
        }, 400);
      }
    }
  });
});

/**
 * Populates all profile elements on the dashboard with Google/Firebase details.
 */
function populateUserData(user) {
  const name = user.displayName || user.email.split("@")[0];
  const email = user.email || "";
  const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=fff`;
  
  // Extract First Name for greeting
  const firstName = name.split(" ")[0];

  // Update elements
  const avatarElements = ["nav-avatar", "mobile-nav-avatar", "hero-avatar"];
  avatarElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = photo;
  });

  const nameElements = ["nav-user-name", "dropdown-name", "mobile-dropdown-name", "user-first-name"];
  nameElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === "user-first-name") {
        el.textContent = firstName;
      } else {
        el.textContent = name;
      }
    }
  });

  const emailElements = ["dropdown-email", "mobile-dropdown-email"];
  emailElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = email;
  });

  // Calculate greeting message based on local time
  const hr = new Date().getHours();
  const greetingEl = document.getElementById("time-of-day-greeting");
  if (greetingEl) {
    if (hr >= 5 && hr < 12) {
      greetingEl.textContent = "Good Morning";
    } else if (hr >= 12 && hr < 17) {
      greetingEl.textContent = "Good Afternoon";
    } else {
      greetingEl.textContent = "Good Evening";
    }
  }
}

/**
 * Initializes all client interactions (Dropdown, Drawer, Logout, Modals).
 */
function initDashboardInteractions() {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Profile Dropdown Toggle
  const dropdownBtn = document.getElementById("profile-dropdown-btn");
  const dropdownMenu = document.getElementById("profile-dropdown-menu");

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("active");
    });

    // Close dropdown on outside click
    window.addEventListener("click", () => {
      if (dropdownMenu.classList.contains("active")) {
        dropdownMenu.classList.remove("active");
      }
    });
  }

  // 2. Mobile Menu Hamburger & Drawer Toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileToggle.classList.toggle("active");
      mobileDrawer.classList.toggle("active");
      document.body.classList.toggle("no-scroll");
    });

    // Close drawer on click outside
    window.addEventListener("click", (e) => {
      if (mobileDrawer.classList.contains("active") && !mobileDrawer.contains(e.target) && e.target !== mobileToggle) {
        mobileToggle.classList.remove("active");
        mobileDrawer.classList.remove("active");
        document.body.classList.remove("no-scroll");
      }
    });
  }

  // 3. Support Contact Action
  const contactBtn = document.getElementById("contact-support-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const recipient = "citadyo.official@gmail.com";
      const subject = encodeURIComponent("Citadyo Support");
      const body = encodeURIComponent("Hi Citadyo Team,\n\nI need help with:\n\n--------------------------------");
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    });
  }

  // 4. Logout Action
  const logoutHandlers = ["logout-btn", "mobile-logout-btn"];
  logoutHandlers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await logout();
          window.location.href = "/";
        } catch (err) {
          console.error("Failed to sign out:", err);
        }
      });
    }
  });
}

/**
 * Reusable Progress Renderer.
 * Can be called with progress percentage and custom steps data.
 * 
 * @param {number} percentage - Current progress (e.g. 20)
 * @param {Array<{id: string, label: string, completed: boolean}>} steps - Steps array
 */
export function renderProgress(percentage, steps) {
  const barEl = document.getElementById("journey-progress-bar");
  const badgeEl = document.getElementById("journey-percent-badge");
  const container = document.getElementById("journey-steps-container");

  if (barEl) barEl.style.width = `${percentage}%`;
  if (badgeEl) badgeEl.textContent = `${percentage}%`;

  if (container) {
    container.innerHTML = "";

    steps.forEach((step) => {
      const stepEl = document.createElement("div");
      stepEl.className = `journey-step ${step.completed ? "completed" : ""}`;
      
      const icon = step.completed ? "check-circle-2" : "circle";
      const iconColor = step.completed ? "var(--accent)" : "#94a3b8";

      stepEl.innerHTML = `
        <div class="step-icon-wrapper">
          <i data-lucide="${icon}" style="color: ${iconColor};"></i>
        </div>
        <div class="step-label">${step.label}</div>
      `;

      container.appendChild(stepEl);
    });

    // Re-trigger Lucide icons to draw the new circles/checkmarks
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
