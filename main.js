import './style.css'
import { createClient } from '@supabase/supabase-js';
import { initCommonUI } from './src/ui/ui.js';
import { setupWaitlistForm } from './src/forms/forms.js';
import { listenForAuth, checkUserExists } from './src/auth/auth.js';
import { initAuthModal, openAuthModal } from './src/ui/loginModal.js';
import { requirePhoneVerification } from './src/ui/phoneGuard.js';
import { initSupport } from './src/ui/support.js';
import { submitForm } from './src/api/api.js';
import { fileToBase64 } from './src/api/uploader.js';

// Cinematic Brand Intro Animation & FLIP Handoff Controller
(function() {
  // 1. Wrap page content dynamically (excluding navbar, scripts, modals, etc.)
  let pageWrapper = document.getElementById('page-wrapper');
  if (!pageWrapper && document.body) {
    pageWrapper = document.createElement('div');
    pageWrapper.id = 'page-wrapper';
    pageWrapper.className = 'hidden-initially';
    
    const nodesToMove = [];
    const children = Array.from(document.body.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const id = child.id || '';
        const tagName = child.tagName.toUpperCase();
        const className = child.className || '';
        const classStr = typeof className === 'string' ? className : '';
        
        if (id === 'navbar' || 
            tagName === 'SCRIPT' || 
            id === 'intro' || 
            classStr.includes('brand-intro') || 
            id.includes('modal') || 
            classStr.includes('modal') || 
            id.includes('support') || 
            classStr.includes('support')) {
          continue;
        }
      }
      nodesToMove.push(child);
    }
    
    const navbar = document.getElementById('navbar');
    if (navbar && navbar.nextSibling) {
      document.body.insertBefore(pageWrapper, navbar.nextSibling);
    } else {
      document.body.appendChild(pageWrapper);
    }
    
    nodesToMove.forEach(node => pageWrapper.appendChild(node));
  }

  const init = () => {
    const isHomepage = !!document.getElementById('intro');
    
    // Clear introPlayed on reload
    const isReload = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]?.type === 'reload') || (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
    if (isReload) {
      sessionStorage.removeItem('introPlayed');
    }
    
    const introPlayed = sessionStorage.getItem('introPlayed') === 'true';
    
    if (!isHomepage || introPlayed) {
      // Mark as played to prevent intro if navigating to home later
      if (!isHomepage) {
        sessionStorage.setItem('introPlayed', 'true');
      }

      if (document.body) {
        document.body.classList.remove('loading-active');
      }
      const pageWrapper = document.getElementById('page-wrapper');
      if (pageWrapper) {
        pageWrapper.classList.add('page-transition-fast');
        pageWrapper.classList.add('visible');
      }
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.style.opacity = '1';
        navbar.style.pointerEvents = 'all';
      }
      const navLogoLink = document.getElementById('nav-logo-link');
      if (navLogoLink) {
        navLogoLink.style.opacity = '1';
        navLogoLink.style.pointerEvents = 'all';
      }
      const intro = document.getElementById('intro');
      if (intro) intro.remove();

      // Start the journey animation immediately on homepage if intro was skipped
      if (isHomepage) {
        if (window.innerWidth > 768) {
          if (window.startHomepageJourney) {
            window.startHomepageJourney();
          }
        } else {
          if (window.startMobileHomepageJourney) {
            window.startMobileHomepageJourney();
          }
        }
      }
      return;
    }
    
    // Brand Intro Animation sequence (Homepage only)
    const intro = document.getElementById('intro');
    const introBg = document.querySelector('.intro-bg-ambient');
    const logoContainer = document.getElementById('brand-logo-container');
    const brandLogoImg = document.getElementById('brand-logo-img');
    const logoShine = document.getElementById('logo-shine');
    const wordmark = document.getElementById('brand-wordmark');
    const navLogoImg = document.getElementById('nav-logo-img');
    const navLogoLink = document.getElementById('nav-logo-link');
    const navbar = document.getElementById('navbar');
    const pageWrapper = document.getElementById('page-wrapper');

    if (!intro || !logoContainer || !brandLogoImg || !logoShine || !wordmark) return;

    // 0.0s - 0.3s: Logo container scales in & ambient glow appears (warm background is immediate)
    setTimeout(() => {
      if (introBg) introBg.classList.add('active');
      if (logoContainer) logoContainer.classList.add('active');
    }, 50);

    // 0.3s - 0.7s: (Logo holds scale focus)
    // No timing block needed - logo holds scale naturally

    // 0.7s - 1.0s: Wordmark slides/fades in using solid brand colors
    setTimeout(() => {
      if (wordmark) wordmark.classList.add('active');
    }, 700);

    // 1.0s - 1.3s: Shine sweep reveal on the logo image
    setTimeout(() => {
      if (logoShine) logoShine.classList.add('sweep-active');
    }, 1000);

    // 1.3s - 1.5s: FLIP collapse transition of brand logo image into navbar logo position
    setTimeout(() => {
      // Fade out wordmark naturally
      if (wordmark) {
        wordmark.classList.remove('active');
        wordmark.classList.add('fade-out');
      }

      if (navLogoImg && navbar && brandLogoImg) {
        const targetRect = navLogoImg.getBoundingClientRect();
        const sourceRect = brandLogoImg.getBoundingClientRect();

        const dx = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
        const dy = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2);
        const scale = targetRect.width / sourceRect.width;

        // Animate image collapse into navbar brand logo
        brandLogoImg.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        brandLogoImg.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        brandLogoImg.style.opacity = '0';
      }
    }, 1300);

    // 1.5s: Reached end of logo collapse. Fade out overlay, reveal page, and start homepage paper plane flight.
    setTimeout(() => {
      if (intro) intro.classList.add('fade-out');
      
      // Reveal the homepage content wrapper
      if (pageWrapper) {
        pageWrapper.classList.add('visible');
      }
      
      if (document.body) {
        document.body.classList.remove('loading-active');
      }

      if (navLogoLink) {
        navLogoLink.style.opacity = '1';
        navLogoLink.style.pointerEvents = 'all';
      }

      // Start the S-curve timeline flight after intro ends
      if (window.innerWidth > 768) {
        if (window.startHomepageJourney) {
          window.startHomepageJourney();
        }
      } else {
        if (window.startMobileHomepageJourney) {
          window.startMobileHomepageJourney();
        }
      }

      // Cleanup overlay after fade transition completes
      setTimeout(() => {
        if (intro) intro.remove();
      }, 400);

      // Save intro state to sessionStorage
      sessionStorage.setItem('introPlayed', 'true');
    }, 1500);
  };

  init();

  // Page Transition Link Click Interceptor
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip hashes, javascript, target="_blank", external links
    if (href.startsWith('#') || href.startsWith('javascript:') || link.getAttribute('target') === '_blank') {
      return;
    }

    // Check if external or same page
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (_) {
      return; // invalid URL
    }

    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      if (url.hash) return; // scroll internal
    }

    // Intercept click and perform page fade-out
    e.preventDefault();
    const pageWrapper = document.getElementById('page-wrapper');
    if (pageWrapper) {
      pageWrapper.classList.add('page-transition-fast');
      pageWrapper.classList.remove('visible');
    }
    setTimeout(() => {
      window.location.href = href;
    }, 250); // 250ms matches transition duration
  });

  window.addEventListener('pageshow', (event) => {
    // If navigated via back/forward history cache, ensure content is visible
    if (event.persisted) {
      const pageWrapper = document.getElementById('page-wrapper');
      if (pageWrapper) {
        pageWrapper.classList.add('page-transition-fast');
        pageWrapper.classList.add('visible');
      }
    }
  });
})();

// Signature Homepage Journey Loop Controller
(function() {
  window.startHomepageJourney = function() {
    const wrapper = document.querySelector('.hero-journey-animation-wrapper');
    if (!wrapper) return;

    const path = document.getElementById('journey-path');
    const progressPath = document.getElementById('journey-path-progress');
    const plane = document.getElementById('journey-plane');
    const milestones = document.querySelectorAll('.milestone');
    const overlay = document.getElementById('welcome-home-overlay');
    if (!path || !plane) return;

    const pathLength = path.getTotalLength();
    if (progressPath) {
      progressPath.style.strokeDasharray = pathLength;
      progressPath.style.strokeDashoffset = pathLength;
    }

    // Mathematical stops mapped along the Bezier curve parametric coordinates
    const stops = [
      { index: 0, percent: 0.00, duration: 1000 },  // Home
      { index: 1, percent: 0.125, duration: 1000 }, // Packing
      { index: 2, percent: 0.25, duration: 1000 },  // Journey
      { index: 3, percent: 0.375, duration: 1000 }, // Arrival
      { index: 4, percent: 0.50, duration: 1000 },  // Associate
      { index: 5, percent: 0.625, duration: 1000 }, // Accommodation
      { index: 6, percent: 0.75, duration: 1000 },  // Kit
      { index: 7, percent: 0.875, duration: 1000 }, // City
      { index: 8, percent: 1.00, duration: 2500 }   // Welcome Home Final Overlay
    ];

    let currentStopIndex = 0;
    let currentPercent = 0;
    let isPausing = false;
    let isOverlayActive = false;
    let animationFrameId = null;

    function updatePlanePosition(percent) {
      const distance = percent * pathLength;
      const pt = path.getPointAtLength(distance);
      
      const ptAhead = path.getPointAtLength(Math.min(distance + 2, pathLength));
      const angle = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180 / Math.PI;

      const xPct = (pt.x / 500) * 100;
      const yPct = (pt.y / 400) * 100;

      plane.style.left = `${xPct}%`;
      plane.style.top = `${yPct}%`;
      plane.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

      if (progressPath) {
        progressPath.style.strokeDashoffset = pathLength - distance;
      }
    }

    function activateMilestone(index) {
      milestones.forEach((m, idx) => {
        if (idx === index) {
          m.classList.add('active');
        } else {
          m.classList.remove('active');
        }
      });
    }

    function deactivateAllMilestones() {
      milestones.forEach(m => m.classList.remove('active'));
    }

    function step() {
      if (isPausing || isOverlayActive) return;

      const targetStop = stops[currentStopIndex];
      const targetPercent = targetStop.percent;

      const delta = 0.0035; // Fine-tuned flight speed
      if (currentPercent < targetPercent) {
        currentPercent = Math.min(currentPercent + delta, targetPercent);
      }

      updatePlanePosition(currentPercent);

      // Check if plane arrived at milestone stop
      if (Math.abs(currentPercent - targetPercent) < 0.001) {
        isPausing = true;
        activateMilestone(currentStopIndex);

        // Welcome Home overlay trigger at last milestone
        if (currentStopIndex === 8) {
          isOverlayActive = true;
          if (overlay) overlay.classList.add('active');
          
          setTimeout(() => {
            if (overlay) overlay.classList.remove('active');
            isOverlayActive = false;
            isPausing = false;
            
            // Loop restart
            currentStopIndex = 0;
            currentPercent = 0;
            deactivateAllMilestones();
            updatePlanePosition(0);
            animationFrameId = requestAnimationFrame(step);
          }, targetStop.duration);
          return;
        }

        setTimeout(() => {
          isPausing = false;
          currentStopIndex = (currentStopIndex + 1) % stops.length;
          animationFrameId = requestAnimationFrame(step);
        }, targetStop.duration);
        
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    }

    // Start Timeline loop
    updatePlanePosition(0);
    animationFrameId = requestAnimationFrame(step);
  };
})();

// Mobile Responsive Homepage Journey Loop Controller
(function() {
  const mobileMilestones = [
    { emoji: "🏠", title: "🏠 Leaving Home", desc: "Your relocation journey begins." },
    { emoji: "📦", title: "📦 Curating Essentials", desc: "Packing only what matters most." },
    { emoji: "✈️", title: "✈️ Relocation Journey", desc: "Crossing distance, building excitement." },
    { emoji: "🛬", title: "🛬 Arrival Day", desc: "Welcome! Transit and safe check-in." },
    { emoji: "🤝", title: "🤝 Meet Your Associate", desc: "A local guide is ready to welcome you." },
    { emoji: "🏡", title: "🏡 Accommodation", desc: "Move into a trusted, safe home." },
    { emoji: "📦", title: "📦 Settling Kit", desc: "Everything ready inside your room on Day 1." },
    { emoji: "🌆", title: "🌆 Explore the City", desc: "Start your new chapter with confidence." },
    { emoji: "💙", title: "💙 Welcome Home", desc: "You're settled with Citadyo." }
  ];

  window.startMobileHomepageJourney = function() {
    const wrapper = document.getElementById('mobile-journey-wrapper');
    if (!wrapper) return;

    const progressLine = document.getElementById('mobile-journey-dot-progress');
    const plane = document.getElementById('mobile-journey-plane-indicator');
    const dots = wrapper.querySelectorAll('.mobile-journey-dot');
    const activeCircle = document.getElementById('mobile-journey-active-circle');
    const emojiEl = document.getElementById('mobile-journey-active-emoji');
    const cardEl = document.getElementById('mobile-journey-active-card');
    const titleEl = document.getElementById('mobile-journey-active-title');
    const descEl = document.getElementById('mobile-journey-active-desc');

    let currentStep = 0;
    let timerId = null;

    function goToStep(step) {
      currentStep = step;
      const percent = step * 12.5;

      // Update plane and progress line
      if (progressLine) progressLine.style.width = `${percent}%`;
      if (plane) plane.style.left = `${percent}%`;

      // Update active dot classes
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === step);
      });

      // Animate active circle pulse
      if (activeCircle) {
        activeCircle.classList.add('pulse');
        setTimeout(() => activeCircle.classList.remove('pulse'), 400);
      }

      // Fade transition for card content
      if (cardEl) {
        cardEl.classList.add('fade-transition');
        setTimeout(() => {
          const data = mobileMilestones[step];
          if (emojiEl) emojiEl.textContent = data.emoji;
          if (titleEl) titleEl.textContent = data.title;
          if (descEl) descEl.textContent = data.desc;
          cardEl.classList.remove('fade-transition');
        }, 300);
      }
    }

    function startLoop() {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        const nextStep = (currentStep + 1) % mobileMilestones.length;
        goToStep(nextStep);
      }, 2000); // 2 seconds per stop
    }

    // Intersection Observer to start when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startLoop();
        } else {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      });
    }, { threshold: 0.15 });

    observer.observe(wrapper);
    goToStep(0);
  };
})();

// ✅ SUPABASE CONFIG (RETAINED FOR NON-MIGRATED FORMS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("Supabase client failed to initialize:", err);
  }
} else {
  console.log("Supabase environment variables not detected in frontend. Non-migrated forms will be unavailable.");
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize modular UI and Waitlist form (Phase 1)
  initCommonUI();
  setupWaitlistForm();

  // Initialize Support System
  initSupport();

  // Initialize Citadyo Authentication Modal
  initAuthModal();

  // Track active firebase user state to handle redirect / modal flow on Get Started clicks
  let activeUser = null;
  listenForAuth((user) => {
    activeUser = user;
  });

  const getStartedButtons = document.querySelectorAll('.get-started-btn');
  getStartedButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (activeUser) {
        // User already logged in, check if they completed onboarding
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Checking session...';
        
        try {
          const exists = await checkUserExists(activeUser.uid);
          if (exists) {
            window.location.href = '/dashboard.html';
            return;
          }
        } catch (err) {
          console.error("Error checking user existence on CTA click:", err);
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      }
      
      // If not logged in, or onboarding not complete, open auth modal
      openAuthModal();
    });
  });



  /* ====================================================
     EXISTING FORMS (RETAINED DURING MIGRATION PHASES)
     ==================================================== */

  // Investor Form Logic
  const investorForm = document.getElementById('investor-form');
  const investorMessageEl = document.getElementById('investor-form-message');

  if (investorForm) {
    investorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!supabase) {
        showMessage('Database configuration is missing.', 'error', investorMessageEl);
        return;
      }

      const nameInput = investorForm.querySelector('#inv-name');
      const emailInput = investorForm.querySelector('#inv-email');

      const name = nameInput?.value.trim();
      const email = emailInput?.value.trim();
      const phone = investorForm.querySelector('#inv-phone')?.value.trim() || null;
      const whatsapp_number = investorForm.querySelector('#inv-whatsapp')?.value.trim() || null;

      let linkedin_url = investorForm.querySelector('#inv-linkedin')?.value.trim() || null;
      if (linkedin_url && !/^https?:\/\//i.test(linkedin_url)) {
        linkedin_url = 'https://' + linkedin_url;
      }

      const location = investorForm.querySelector('#inv-location')?.value.trim() || null;
      const organization = investorForm.querySelector('#inv-org')?.value.trim() || null;
      const role = investorForm.querySelector('#inv-role')?.value.trim() || null;
      const profile = investorForm.querySelector('#inv-profile')?.value || null;
      const invested_before = investorForm.querySelector('#inv-invested')?.value || null;
      const interest = investorForm.querySelector('#inv-interest')?.value.trim() || null;
      const contact_preference = investorForm.querySelector('#inv-contact')?.value || null;

      // Validation Logic
      let isValid = true;
      const nameError = investorForm.querySelector('#inv-name-error');
      const emailError = investorForm.querySelector('#inv-email-error');

      // Reset errors
      nameInput.classList.remove('invalid');
      emailInput.classList.remove('invalid');
      if (nameError) {
        nameError.textContent = '';
        nameError.classList.remove('visible');
      }
      if (emailError) {
        emailError.textContent = '';
        emailError.classList.remove('visible');
      }

      if (!name) {
        nameInput.classList.add('invalid');
        if (nameError) {
          nameError.textContent = 'Name is required';
          nameError.classList.add('visible');
        }
        isValid = false;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.classList.add('invalid');
        if (emailError) {
          emailError.textContent = 'Please enter a valid email';
          emailError.classList.add('visible');
        }
        isValid = false;
      }

      if (!isValid) return;

      const btn = investorForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      try {
        const { error } = await supabase
          .from('investors')
          .insert([
            {
              name, email, phone, whatsapp_number, linkedin_url, location,
              organization, role, profile, invested_before, interest, contact_preference
            }
          ]);

        if (error) throw error;

        // Trigger investor email
        try {
          await emailjs.send("service_l0sibnb", "template_g1ov2bk", {
            name: name,
            email: email
          });

          console.log("Investor email sent via EmailJS");
        } catch (emailErr) {
          console.error("EmailJS error:", emailErr);
        }

        showMessage('Application submitted successfully! 🎉', 'success', investorMessageEl);
        investorForm.reset();
      } catch (err) {
        console.error('Supabase error:', err);
        showMessage('Something went wrong. Please try again.', 'error', investorMessageEl);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Associate Form Logic
  const associateForm = document.getElementById('associate-form');
  const associateMessageEl = document.getElementById('associate-form-message');

  if (associateForm) {
    associateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = associateForm.querySelector('#assoc-name');
      const emailInput = associateForm.querySelector('#assoc-email');
      const phoneInput = associateForm.querySelector('#assoc-phone');
      const cityAreaInput = associateForm.querySelector('#assoc-city-area');

      const name = nameInput?.value.trim();
      const email = emailInput?.value.trim();
      const phone = phoneInput?.value.trim();
      const city_area = cityAreaInput?.value.trim();

      const native_place = associateForm.querySelector('#assoc-native-place')?.value.trim() || null;
      const gender = associateForm.querySelector('#assoc-gender')?.value || null;
      const profile_type = associateForm.querySelector('#assoc-profile-type')?.value || null;

      let college = null;
      let company = null;
      let role = null;
      let experience_years = null;
      let collegeIdFile = null;

      if (profile_type === 'student') {
        college = associateForm.querySelector('#assoc-college')?.value.trim() || null;
        const fileInput = associateForm.querySelector('#assoc-college-id');
        if (fileInput && fileInput.files.length > 0) {
          collegeIdFile = fileInput.files[0];
        }
      } else if (profile_type === 'working') {
        company = associateForm.querySelector('#assoc-company')?.value.trim() || null;
        role = associateForm.querySelector('#assoc-role')?.value.trim() || null;
        const expStr = associateForm.querySelector('#assoc-exp')?.value;
        experience_years = expStr ? parseFloat(expStr) : null;
      }

      const primary_language = associateForm.querySelector('#assoc-lang-primary')?.value.trim() || null;
      const secondary_language = associateForm.querySelector('#assoc-lang-sec')?.value.trim() || null;
      const other_languages = associateForm.querySelector('#assoc-lang-other')?.value.trim() || null;

      const drivingStr = associateForm.querySelector('#assoc-driving')?.value;
      const driving = drivingStr === 'Yes';
      const vehicle = associateForm.querySelector('#assoc-vehicle')?.value.trim() || null;
      const motivation = associateForm.querySelector('#assoc-motivation')?.value.trim() || null;
      const declarationInput = associateForm.querySelector('#assoc-declaration');
      const declaration = declarationInput?.checked || false;

      // Validation
      let isValid = true;
      const collegeIdError = associateForm.querySelector('#assoc-college-id-error');

      if (profile_type === 'student' && !collegeIdFile) {
        if (collegeIdError) {
          collegeIdError.textContent = 'College ID upload is required';
          collegeIdError.classList.add('visible');
        }
        isValid = false;
      }

      if (!isValid) return;

      const btn = associateForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      try {
        let collegeIdFileData = null;
        if (profile_type === 'student' && collegeIdFile) {
          try {
            collegeIdFileData = await fileToBase64(collegeIdFile);
          } catch (fileErr) {
            console.error("Failed to parse file to Base64:", fileErr);
            throw new Error('Failed to process College ID file. Please try again.');
          }
        }

        const payload = {
          name,
          phone,
          email,
          city_area,
          native_place,
          gender,
          profile_type,
          college,
          company,
          role,
          experience_years,
          primary_language,
          secondary_language,
          other_languages,
          driving,
          vehicle,
          motivation,
          declaration,
          collegeIdFile: collegeIdFileData
        };

        await submitForm('associate', payload);

        // Email trigger (Fallback / Notification)
        try {
          await emailjs.send("service_l0sibnb", "template_g1ov2bk", {
            name: name,
            email: email
          });
          console.log("Email sent via EmailJS");
        } catch (emailErr) {
          console.error("EmailJS error:", emailErr);
        }

        showMessage('Application received. We’ll get back to you soon.', 'success', associateMessageEl);
        associateForm.reset();

      } catch (err) {
        console.error('Form submission error:', err);
        showMessage(err.message || 'Something went wrong.', 'error', associateMessageEl);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }


  // Driver Form Logic
  const driverForm = document.getElementById('driver-form');
  const driverMessageEl = document.getElementById('driver-form-message');

  if (driverForm) {
    driverForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = driverForm.querySelector('#driver-name');
      const phoneInput = driverForm.querySelector('#driver-phone');

      const name = nameInput?.value.trim();
      const phone = phoneInput?.value.trim();
      const email = driverForm.querySelector('#driver-email')?.value.trim() || null;
      const gender = driverForm.querySelector('#driver-gender')?.value || null;

      const city_area = driverForm.querySelector('#driver-city-area')?.value.trim();
      const native_place = driverForm.querySelector('#driver-native-place')?.value.trim();

      const vehicle_number = driverForm.querySelector('#driver-vehicle-number')?.value.trim();
      const car_model = driverForm.querySelector('#driver-car-model')?.value.trim();
      const vehicle_type = driverForm.querySelector('#driver-vehicle-type')?.value;
      const fuel_type = driverForm.querySelector('#driver-fuel-type')?.value;
      const ac_type = driverForm.querySelector('#driver-ac-type')?.value;

      const experience_years = driverForm.querySelector('#driver-exp-years')?.value;
      const airport_exp_str = driverForm.querySelector('#driver-airport-exp')?.value;

      const work_preference = driverForm.querySelector('#driver-work-pref')?.value;

      const primary_language = driverForm.querySelector('#driver-lang-primary')?.value.trim();
      const secondary_language = driverForm.querySelector('#driver-lang-sec')?.value.trim();
      const other_languages = driverForm.querySelector('#driver-lang-other')?.value.trim() || null;

      const fileInput = driverForm.querySelector('#driver-license');
      const licenseFile = (fileInput && fileInput.files.length > 0) ? fileInput.files[0] : null;

      const declarationInput = driverForm.querySelector('#driver-declaration');
      const declaration = declarationInput?.checked || false;

      // Validation Logic
      let isValid = true;
      const nameError = driverForm.querySelector('#driver-name-error');
      const phoneError = driverForm.querySelector('#driver-phone-error');
      const licenseError = driverForm.querySelector('#driver-license-error');
      const declarationError = driverForm.querySelector('#driver-declaration-error');

      // Reset errors
      nameInput.classList.remove('invalid');
      phoneInput.classList.remove('invalid');
      if (nameError) { nameError.textContent = ''; nameError.classList.remove('visible'); }
      if (phoneError) { phoneError.textContent = ''; phoneError.classList.remove('visible'); }
      if (licenseError) { licenseError.textContent = ''; licenseError.classList.remove('visible'); }
      if (declarationError) { declarationError.textContent = ''; declarationError.classList.remove('visible'); }

      if (!name) {
        nameInput.classList.add('invalid');
        if (nameError) { nameError.textContent = 'Name is required'; nameError.classList.add('visible'); }
        isValid = false;
      }

      if (!phone) {
        phoneInput.classList.add('invalid');
        if (phoneError) { phoneError.textContent = 'Phone is required'; phoneError.classList.add('visible'); }
        isValid = false;
      }

      if (!licenseFile) {
        if (licenseError) { licenseError.textContent = 'Driving license upload is required'; licenseError.classList.add('visible'); }
        isValid = false;
      }

      if (!declaration) {
        if (declarationError) { declarationError.textContent = 'You must agree to the partner guidelines.'; declarationError.classList.add('visible'); }
        isValid = false;
      }

      if (!isValid) return;

      const btn = driverForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      try {
        let licenseFileData = null;
        if (licenseFile) {
          try {
            licenseFileData = await fileToBase64(licenseFile);
          } catch (fileErr) {
            console.error("Failed to parse license file to Base64:", fileErr);
            throw new Error('Failed to process Driving License file. Please try again.');
          }
        }

        const payload = {
          name,
          phone,
          email,
          gender,
          city_area,
          native_place,
          vehicle_number,
          car_model,
          vehicle_type,
          fuel_type,
          ac_type,
          experience_years,
          airport_experience: airport_exp_str === 'Yes',
          work_preference,
          primary_language,
          secondary_language,
          other_languages,
          licenseFile: licenseFileData,
          declaration
        };

        // Submit directly to Google Apps Script API endpoint
        await submitForm('driver', payload);

        // Trigger driver email via local API
        if (email) {
          try {
            await emailjs.send("service_l0sibnb", "template_g1ov2bk", {
              name: name,
              email: email
            });
            console.log("Driver email sent");
          } catch (emailErr) {
            console.error("EmailJS error:", emailErr);
          }
        }

        showMessage('Application received. We’ll contact you soon.', 'success', driverMessageEl);
        driverForm.reset();

      } catch (err) {
        console.error('Form submission error:', err);
        showMessage(err.message || 'Something went wrong. Please try again.', 'error', driverMessageEl);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Helper function for local forms messaging
  function showMessage(msg, type, targetEl) {
    if (!targetEl) return;
    targetEl.textContent = msg;
    targetEl.className = `form-message ${type}`;

    if (type === 'success') {
      setTimeout(() => {
        targetEl.textContent = '';
        targetEl.className = 'form-message';
      }, 5000);
    }
  }

  // Rental Form Logic (retained from existing main.js)
  const rentalForm = document.getElementById("rentalForm");
  if (rentalForm) {
    rentalForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!supabaseUrl || !supabaseKey) {
        const msg = document.getElementById("form-message");
        if (msg) msg.innerText = "Database configuration is missing.";
        return;
      }

      const useCases = [...document.querySelectorAll(".use_cases:checked")]
        .map(el => el.value)
        .join(",");

      const vehicleTypes = [...document.querySelectorAll(".vehicle_types:checked")]
        .map(el => el.value)
        .join(",");

      const data = {
        company_name: document.getElementById("company_name").value,
        owner_name: document.getElementById("owner_name").value,
        city_area: document.getElementById("city_area").value,
        business_address: document.getElementById("business_address").value,
        contact_number: document.getElementById("contact_number").value,
        website: document.getElementById("website").value,
        service_type: document.getElementById("service_type").value,
        use_cases: useCases,
        vehicle_count: document.getElementById("vehicle_count").value,
        vehicle_types: vehicleTypes,
        pilot_ready: document.getElementById("pilot_ready").value === "true",
        on_demand_ready: document.getElementById("on_demand_ready").value === "true",
        platform_experience: document.getElementById("platform_experience").value,
        motivation: document.getElementById("motivation").value,
        declaration: document.getElementById("declaration").checked
      };

      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rental_partners`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(data)
        });

        const msg = document.getElementById("form-message");

        if (res.ok) {
          // Send email
          await fetch("http://localhost:3001/rental-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: document.getElementById("email")?.value || "",
              company_name: document.getElementById("company_name").value
            })
          });

          msg.innerText = "Application submitted successfully!";
          rentalForm.reset();
        } else {
          msg.innerText = "Something went wrong. Try again.";
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});
