/**
 * Citadyo Shared UI Controllers & Actions
 */

import { auth } from '../auth/firebase.js';
import { requirePhoneVerification } from './phoneGuard.js';
import { submitForm } from '../api/api.js';

/**
 * Initializes sticky navigation, mobile menu listeners, modals, smooth scroll anchors, and entrance animation observers.
 */
export function initCommonUI() {
  // 1. Sticky Navbar
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // 2. Mobile Menu Logic
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // 3. Mobile Dropdown Toggle
  const dropdown = document.querySelector('.dropdown');
  const dropbtn = document.querySelector('.dropbtn');
  if (dropbtn && dropdown) {
    dropbtn.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle('active');
      }
    });
  }

  // 4. Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        scrollToElementWithOffset(targetElement);
      }
    });
  });

  // 5. Scroll to services via main Relocation button
  const viewPlanBtn = document.getElementById("view-plan-btn");
  if (viewPlanBtn) {
    viewPlanBtn.addEventListener("click", () => {
      const targetElement = document.getElementById("services");
      if (targetElement) {
        scrollToElementWithOffset(targetElement);
      }
    });
  }

  // 6. Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in, .fade-in-up').forEach((el) => {
    observer.observe(el);
  });

  // 7. Details Modal logic (e.g. for Arrival Assistance packages)
  const modalOverlay = document.getElementById('kitModal');
  const openModalBtns = document.querySelectorAll('.open-modal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalTagline = document.getElementById('modalTagline');
  const modalCategories = document.getElementById('modalCategories');

  if (modalOverlay) {
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const title = btn.getAttribute('data-title');
        const tagline = btn.getAttribute('data-tagline');
        const categoriesStr = btn.getAttribute('data-categories');

        let categories = [];
        try {
          categories = JSON.parse(categoriesStr || '[]');
        } catch (err) {
          console.error('Failed to parse categories:', err);
        }

        if (modalTitle) modalTitle.textContent = title;
        if (modalTagline) modalTagline.textContent = tagline;

        if (modalCategories) {
          modalCategories.innerHTML = '';
          categories.forEach(cat => {
            const span = document.createElement('span');
            span.className = 'modal-category';
            span.innerHTML = cat;
            modalCategories.appendChild(span);
          });
        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // 8. Init Phone Verification Prompt Popup
  initPhoneVerificationPrompt();
}

/**
 * Scroll viewport smoothly with a constant header height offset.
 * @param {HTMLElement} element - Target element to scroll to
 */
function scrollToElementWithOffset(element) {
  const headerOffset = 80;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Displays error, success, or validation messages in forms.
 * 
 * @param {string} msg - Message content to show
 * @param {'success'|'error'|''} type - Status type
 * @param {HTMLElement} targetEl - Element container where the message should be written
 */
export function showFormMessage(msg, type, targetEl) {
  if (!targetEl) return;
  
  targetEl.textContent = msg;
  targetEl.className = `form-message ${type}`;
  targetEl.style.display = 'block';

  if (type === 'success') {
    targetEl.style.background = '#d1fae5';
    targetEl.style.color = '#065f46';
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      targetEl.textContent = '';
      targetEl.className = 'form-message';
      targetEl.style.display = 'none';
    }, 5000);
  } else if (type === 'error') {
    targetEl.style.background = '#fee2e2';
    targetEl.style.color = '#991b1b';
  } else {
    targetEl.style.background = '';
    targetEl.style.color = '';
    targetEl.style.display = 'none';
  }
}

/**
 * Checks verification status in Google Sheets database and caches it in sessionStorage.
 */
async function checkPhoneVerificationStatus(user) {
  if (!user) return false;
  
  const cacheKey = `phone_verified_${user.uid}`;
  const cachedStatus = sessionStorage.getItem(cacheKey);
  if (cachedStatus !== null) {
    return cachedStatus === "true";
  }

  if (user.phoneNumber) {
    sessionStorage.setItem(cacheKey, "true");
    return true;
  }

  try {
    const userRow = await submitForm('getUser', { uid: user.uid });
    const isVerified = userRow.exists && (
      userRow.user.PhoneVerified === true ||
      String(userRow.user.PhoneVerified).toLowerCase() === "true" ||
      String(userRow.user.PhoneVerified).toLowerCase() === "yes"
    );
    sessionStorage.setItem(cacheKey, isVerified ? "true" : "false");
    return isVerified;
  } catch (err) {
    console.error("[PhonePrompt] Error querying verification state:", err);
    return false;
  }
}

/**
 * Sets up listeners for displaying the premium, dismissible phone verification reminder popup.
 */
function initPhoneVerificationPrompt() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    
    // Check if user has already dismissed the prompt in this session
    if (sessionStorage.getItem('citadyo_phone_prompt_dismissed') === 'true') {
      return;
    }
    
    // Check verification status
    const isVerified = await checkPhoneVerificationStatus(user);
    if (isVerified) return;
    
    // If not verified and popup not already active
    if (document.getElementById('citadyo-phone-prompt')) return;
    
    // Inject popup HTML
    const popupHtml = `
      <div id="citadyo-phone-prompt" class="phone-prompt-popup">
        <div class="phone-prompt-header">
          <h4 class="phone-prompt-title">💙 Make your move smoother</h4>
          <button class="phone-prompt-close" id="phone-prompt-close-btn" aria-label="Close prompt">&times;</button>
        </div>
        <p class="phone-prompt-desc">
          Verify your phone number to enjoy a faster booking experience, quicker support, and real-time updates from the Citadyo team.
        </p>
        <div class="phone-prompt-actions">
          <button class="phone-prompt-btn-later" id="phone-prompt-later-btn">Maybe Later</button>
          <button class="phone-prompt-btn-verify" id="phone-prompt-verify-btn">Verify Now</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    
    const promptEl = document.getElementById('citadyo-phone-prompt');
    setTimeout(() => {
      if (promptEl) promptEl.classList.add('active');
    }, 1000);
    
    // Dismiss function
    const dismissPrompt = () => {
      if (promptEl) {
        promptEl.classList.remove('active');
        sessionStorage.setItem('citadyo_phone_prompt_dismissed', 'true');
        setTimeout(() => promptEl.remove(), 500);
      }
    };
    
    const closeBtn = document.getElementById('phone-prompt-close-btn');
    const laterBtn = document.getElementById('phone-prompt-later-btn');
    const verifyBtn = document.getElementById('phone-prompt-verify-btn');

    if (closeBtn) closeBtn.addEventListener('click', dismissPrompt);
    if (laterBtn) laterBtn.addEventListener('click', dismissPrompt);
    
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => {
        dismissPrompt();
        requirePhoneVerification(window.location.href);
      });
    }
  });
}
