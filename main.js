import './style.css'


const supabaseUrl = 'https://rdqyrdtzspgnkquvixit.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXlyZHR6c3BnbmtxdXZpeGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDQ3ODgsImV4cCI6MjA5MzIyMDc4OH0.HHD78-sFISK-RLqrb2EdmOtavAO1PxeqAfi2EAGanto'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  // Sticky Navbar Logic
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile Menu Logic
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Mobile Dropdown Toggle
  const dropdown = document.querySelector('.dropdown');
  const dropbtn = document.querySelector('.dropbtn');

  if (dropbtn) {
    dropbtn.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle('active');
      }
    });
  }
  // View Relocation Plan → Scroll to Services
  const btn = document.getElementById("view-plan-btn");

  if (btn) {
    btn.onclick = function () {
      const section = document.getElementById("services");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth"
        });
      }
    };
  }
  // Waitlist Form Logic
  const form = document.getElementById('waitlist-form');
  const messageEl = document.getElementById('form-message');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = form.querySelector('#name');
      const emailInput = form.querySelector('#email');
      const cityInput = form.querySelector('#city');

      const name = nameInput?.value.trim();
      const email = emailInput?.value.trim();
      const city = cityInput?.value.trim() || null;

      // Validation Logic
      let isValid = true;
      const nameError = form.querySelector('#name-error');
      const emailError = form.querySelector('#email-error');

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

      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Joining...';
      btn.disabled = true;

      try {
        const { error } = await supabase
          .from('waitlist_users')
          .insert([
            { name, email, destination_city: city }
          ]);

        if (error) throw error;

        // Trigger welcome email via local API
        try {
          emailjs.init("2eQPcf78ba9teOHLW");

          await emailjs.send("service_l0sibnb", "template_goz8c2o", {
            email: email
          });

          console.log("Email sent successfully");

        } catch (emailErr) {
          console.error("EmailJS error:", emailErr);
        }

        showMessage('You\'re on the waitlist 🎉', 'success');
        form.reset();
      } catch (err) {
        console.error('Supabase error:', err);
        showMessage('Something went wrong. Please try again.', 'error');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Investor Form Logic
  const investorForm = document.getElementById('investor-form');
  const investorMessageEl = document.getElementById('investor-form-message');

  if (investorForm) {
    investorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

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

      // ✅ IMPORTANT FIX
      let college_id_url = null;

      try {
        if (profile_type === 'student' && collegeIdFile) {

          const fileExt = collegeIdFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `associates/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('associate-docs')
            .upload(filePath, collegeIdFile);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload College ID. Please try again.');
          }

          const { data: publicUrlData } = supabase.storage
            .from('associate-docs')
            .getPublicUrl(filePath);

          college_id_url = publicUrlData?.publicUrl || null;

          // ✅ DEBUG (VERY IMPORTANT)
          console.log("FILE URL:", college_id_url);
        }

        const { error } = await supabase
          .from('associates')
          .insert([
            {
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
              college_id_url // ✅ FIXED
            }
          ]);

        if (error) {
          console.error("Insert error FULL:", JSON.stringify(error, null, 2));
          throw new Error('Failed to submit application. Please try again.');
        }

        // Email trigger (unchanged)
        // ✅ EMAILJS
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
      const ac_type = driverForm.querySelector('#driver-ac-type')?.value;

      const experience_years = driverForm.querySelector('#driver-exp-years')?.value;
      const airport_exp_str = driverForm.querySelector('#driver-airport-exp')?.value;
      const airport_experience = airport_exp_str === 'Yes';

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
        let license_url = null;

        if (licenseFile) {
          const fileExt = licenseFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `drivers/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('driver-docs')
            .upload(filePath, licenseFile);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload driving license. Please try again.');
          }

          const { data: publicUrlData } = supabase.storage
            .from('driver-docs')
            .getPublicUrl(filePath);

          license_url = publicUrlData?.publicUrl || null;
        }

        const { error } = await supabase
          .from('cab_drivers')
          .insert([
            {
              name, phone, email, city_area, native_place, gender,
              vehicle_number, car_model, vehicle_type, ac_type,
              experience_years, airport_experience, work_preference,
              primary_language, secondary_language, other_languages,
              license_url, declaration
            }
          ]);

        if (error) throw new Error('Failed to submit application. Please try again.');

        // Trigger driver email via local API
        // ✅ EMAILJS
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

  function showMessage(msg, type, targetEl = messageEl) {
    if (!targetEl) return;
    targetEl.textContent = msg;
    targetEl.className = `form-message ${type}`;

    // Clear message after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        targetEl.textContent = '';
        targetEl.className = 'form-message';
      }, 5000);
    }
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Account for sticky header
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  // View Relocation Plan button scroll (FIXED)
  const viewPlanBtn = document.getElementById("view-plan-btn");

  if (viewPlanBtn) {
    viewPlanBtn.addEventListener("click", () => {
      const targetElement = document.getElementById("services");

      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  }

  // Intersection Observer for Animations
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

  // Modal Logic
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
        } catch (e) {
          console.error('Failed to parse categories:', e);
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
            // =========================
            // View Relocation Plan → Open Offerings
            // =========================


          });

        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
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
});
const rentalForm = document.getElementById("rentalForm");

if (rentalForm) {
  rentalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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

        // 🔥 SEND EMAIL (BACKEND CALL)
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

        // ✅ SUCCESS UI
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
