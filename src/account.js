import { listenForAuth, logout } from "./auth/auth.js";
import { submitForm } from "./api/api.js";
import { initSupport } from "./ui/support.js";
import { requirePhoneVerification } from "./ui/phoneGuard.js";
import "./account.css";

// Global User Reference
let currentUserObj = null;
let googleUser = null;
let userPhoneVerified = false;

// DOM Cache
const loader = document.getElementById("account-loader");
const googleNameInput = document.getElementById("google-name-input");
const preferredNameInput = document.getElementById("preferred-name-input");
const emailInput = document.getElementById("email-input");
const destinationCitySelect = document.getElementById("destination-city-select");
const moveStatusSelect = document.getElementById("move-status-select");
const userTypeSelect = document.getElementById("user-type-select");
const collegeInput = document.getElementById("college-input");
const companyInput = document.getElementById("company-input");

const groupCollege = document.getElementById("group-college");
const groupCompany = document.getElementById("group-company");

const phoneDisplayText = document.getElementById("phone-display-text");
const phoneStatusContainer = document.getElementById("phone-status-container");

const infoMemberSince = document.getElementById("info-member-since");
const infoLastLogin = document.getElementById("info-last-login");

const completionTasksList = document.getElementById("completion-tasks-list");
const completionBarFill = document.getElementById("completion-bar-fill");
const completionPercentText = document.getElementById("completion-percent-text");

const navInitialAvatar = document.getElementById("nav-initial-avatar");
const mobileInitialAvatar = document.getElementById("mobile-initial-avatar");
const accountLargeAvatar = document.getElementById("account-large-avatar");
const accountIdentityName = document.getElementById("account-identity-name");
const accountIdentityEmail = document.getElementById("account-identity-email");

const saveProfileBtn = document.getElementById("save-profile-btn");
const successSaveModal = document.getElementById("success-save-modal");

/**
 * Returns the first letter of a name capitalized.
 */
function getInitial(name) {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Formats ISO strings into readable local dates.
 */
function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (err) {
    return dateVal;
  }
}

/**
 * Calculates and dynamically renders the Profile Completion checklist.
 */
function updateCompletionProgress() {
  const hasPrefName = preferredNameInput.value.trim() !== '';
  const hasCity = destinationCitySelect.value !== '';
  const isTypeStudent = userTypeSelect.value === 'Student';
  const isTypeProfessional = userTypeSelect.value === 'Working Professional';
  
  let hasTypeSpecific = false;
  if (isTypeStudent && collegeInput.value.trim() !== '') {
    hasTypeSpecific = true;
  } else if (isTypeProfessional && companyInput.value.trim() !== '') {
    hasTypeSpecific = true;
  }

  // Define tasks
  const tasks = [
    { label: "Email Verified", done: true }, // Always verified through Google sign-in
    { label: "Preferred Name", done: hasPrefName },
    { label: "Phone Verification", done: userPhoneVerified },
    { label: "Destination City", done: hasCity },
    { 
      label: isTypeProfessional ? "Company Name" : (isTypeStudent ? "College Name" : "College or Company"),
      done: hasTypeSpecific 
    }
  ];

  // Calculate percentage
  const completedCount = tasks.filter(t => t.done).length;
  const percentage = completedCount * 20;

  // Render checklist markup
  if (completionTasksList) {
    completionTasksList.innerHTML = tasks.map(task => {
      const icon = task.done ? '✔' : '○';
      const statusClass = task.done ? 'checked' : 'unchecked';
      return `
        <div class="completion-task-row ${statusClass}">
          <span class="completion-task-icon">${icon}</span>
          <span>${task.label}</span>
        </div>
      `;
    }).join('');
  }

  // Update progress bar
  if (completionBarFill) {
    completionBarFill.style.width = `${percentage}%`;
  }
  if (completionPercentText) {
    completionPercentText.textContent = `${percentage}% Complete`;
  }

  return percentage;
}

/**
 * Populates page elements with User details loaded from Google Sheet database.
 */
function populateAccountData(userData) {
  currentUserObj = userData;
  const name = userData.PreferredName || googleUser.displayName || googleUser.email.split("@")[0];
  const email = googleUser.email || userData.Email || "";
  const initial = getInitial(name);

  // Set avatars & banners
  if (navInitialAvatar) navInitialAvatar.textContent = initial;
  if (mobileInitialAvatar) mobileInitialAvatar.textContent = initial;
  if (accountLargeAvatar) accountLargeAvatar.textContent = initial;
  if (accountIdentityName) accountIdentityName.textContent = name;
  if (accountIdentityEmail) accountIdentityEmail.textContent = email;

  // Dropdown names
  const dropdownName = document.getElementById("dropdown-name");
  const dropdownEmail = document.getElementById("dropdown-email");
  const mobileDropdownName = document.getElementById("mobile-dropdown-name");
  const mobileDropdownEmail = document.getElementById("mobile-dropdown-email");

  if (dropdownName) dropdownName.textContent = userData.GoogleName || name;
  if (dropdownEmail) dropdownEmail.textContent = email;
  if (mobileDropdownName) mobileDropdownName.textContent = userData.GoogleName || name;
  if (mobileDropdownEmail) mobileDropdownEmail.textContent = email;

  // Basic info inputs
  if (googleNameInput) googleNameInput.value = userData.GoogleName || googleUser.displayName || "";
  if (preferredNameInput) preferredNameInput.value = userData.PreferredName || "";
  if (emailInput) emailInput.value = email;

  // Phone Verification UI
  userPhoneVerified = (
    userData.PhoneVerified === true ||
    String(userData.PhoneVerified).toLowerCase() === "true" ||
    String(userData.PhoneVerified).toLowerCase() === "yes"
  );
  
  const rawPhone = userData.Phone || "";
  if (phoneDisplayText) {
    phoneDisplayText.textContent = rawPhone ? rawPhone : "No phone number added";
  }

  if (phoneStatusContainer) {
    phoneStatusContainer.innerHTML = '';
    if (userPhoneVerified) {
      phoneStatusContainer.innerHTML = `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> Verified</span>`;
    } else {
      const verifyBtn = document.createElement("button");
      verifyBtn.type = "button";
      verifyBtn.className = "btn-verify-phone";
      verifyBtn.textContent = "Verify Phone";
      verifyBtn.addEventListener("click", () => {
        // Trigger existing Phone Guard OTP Modal
        requirePhoneVerification(window.location.href);
      });
      phoneStatusContainer.appendChild(verifyBtn);
    }
  }

  // Move options
  if (destinationCitySelect) destinationCitySelect.value = userData.DestinationCity || "";
  if (moveStatusSelect) moveStatusSelect.value = userData.MoveStatus || "";

  // About Me values
  if (userTypeSelect) userTypeSelect.value = userData.UserType || "";
  if (collegeInput) collegeInput.value = userData.College || "";
  if (companyInput) companyInput.value = userData.Company || "";
  toggleAboutMeFields(userData.UserType || "");

  // Metadata logs
  if (infoMemberSince) infoMemberSince.textContent = formatDate(userData.MemberSince || userData.CreatedAt);
  if (infoLastLogin) infoLastLogin.textContent = formatDate(userData.LastLogin);

  // Initialize progress checks
  updateCompletionProgress();

  // Re-trigger Lucide icons to capture new layout symbols
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Toggles College vs Company field visibility based on User Type.
 */
function toggleAboutMeFields(userType) {
  if (userType === 'Student') {
    if (groupCollege) groupCollege.classList.remove('hidden');
    if (groupCompany) groupCompany.classList.add('hidden');
    if (companyInput) companyInput.value = '';
  } else if (userType === 'Working Professional') {
    if (groupCompany) groupCompany.classList.remove('hidden');
    if (groupCollege) groupCollege.classList.add('hidden');
    if (collegeInput) collegeInput.value = '';
  } else {
    if (groupCollege) groupCollege.classList.add('hidden');
    if (groupCompany) groupCompany.classList.add('hidden');
    if (collegeInput) collegeInput.value = '';
    if (companyInput) companyInput.value = '';
  }
  updateCompletionProgress();
}

/**
 * Binds page event handlers and dropdown interactions.
 */
function initAccountInteractions() {
  // Toggle User Type Visibility
  if (userTypeSelect) {
    userTypeSelect.addEventListener('change', () => {
      toggleAboutMeFields(userTypeSelect.value);
    });
  }

  // Real-time progress updates on changes
  preferredNameInput.addEventListener('input', updateCompletionProgress);
  destinationCitySelect.addEventListener('change', updateCompletionProgress);
  collegeInput.addEventListener('input', updateCompletionProgress);
  companyInput.addEventListener('input', updateCompletionProgress);

  // Save changes action
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      saveProfileBtn.disabled = true;
      const originalText = saveProfileBtn.textContent;
      saveProfileBtn.textContent = 'Saving...';

      const completionPct = updateCompletionProgress();

      try {
        const payload = {
          uid: googleUser.uid,
          name: googleUser.displayName || googleUser.email.split('@')[0],
          preferredName: preferredNameInput.value.trim(),
          destinationCity: destinationCitySelect.value,
          moveStatus: moveStatusSelect.value,
          userType: userTypeSelect.value,
          college: collegeInput.value.trim(),
          company: companyInput.value.trim(),
          profileComplete: `${completionPct}%`
        };

        await submitForm('updateProfile', payload);

        // Render success modal overlay
        if (successSaveModal) {
          successSaveModal.classList.add('active');
          document.body.style.overflow = "hidden";

          // Automatic redirect in 3 seconds to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 3000);
        }

      } catch (err) {
        console.error("[Account] Failed to update profile details:", err);
        alert("Failed to save changes. Please verify your connection and try again.");
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = originalText;
      }
    });
  }

  // Profile dropdown menu listeners (Desktop)
  const dropdownBtn = document.getElementById("profile-dropdown-btn");
  const dropdownMenu = document.getElementById("profile-dropdown-menu");

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("active");
    });
    window.addEventListener("click", () => {
      if (dropdownMenu.classList.contains("active")) {
        dropdownMenu.classList.remove("active");
      }
    });
  }

  // Mobile menu Hamburger & Drawer listeners
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileToggle.classList.toggle("active");
      mobileDrawer.classList.toggle("active");
      document.body.classList.toggle("no-scroll");
    });
    window.addEventListener("click", (e) => {
      if (mobileDrawer.classList.contains("active") && !mobileDrawer.contains(e.target) && e.target !== mobileToggle) {
        mobileToggle.classList.remove("active");
        mobileDrawer.classList.remove("active");
        document.body.classList.remove("no-scroll");
      }
    });
  }

  // Logout listener
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

  // Re-draw Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Initial Page Load Hook
document.addEventListener("DOMContentLoaded", () => {
  // Secure route via auth check
  listenForAuth(async (user) => {
    if (!user) {
      window.location.href = "/";
    } else {
      googleUser = user;
      
      // Initialize Companion Support Widget
      initSupport();

      try {
        const response = await submitForm('getUser', { uid: user.uid });
        if (response.exists) {
          populateAccountData(response.user);
        } else {
          // Fallback if sheet record was not created during login
          populateAccountData({
            GoogleName: user.displayName || user.email.split("@")[0],
            Email: user.email || ""
          });
        }

        // Hide overlay loader
        if (loader) {
          loader.style.opacity = "0";
          setTimeout(() => {
            loader.style.display = "none";
          }, 400);
        }

        // Bind events
        initAccountInteractions();

      } catch (err) {
        console.error("[Account] Failed to load profile payload:", err);
        alert("An error occurred loading your account data. Redirecting to dashboard...");
        window.location.href = "/dashboard.html";
      }
    }
  });
});
