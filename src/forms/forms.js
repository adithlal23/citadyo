/**
 * Citadyo Form Handlers & Submission Managers
 */

import { submitForm } from '../api/api.js';
import { showFormMessage } from '../ui/ui.js';
import { auth } from '../auth/firebase.js';
import { requirePhoneVerification } from '../ui/phoneGuard.js';

/**
 * Attaches submit listeners and handles validation for the Waitlist Form
 */
export function setupWaitlistForm() {
  const form = document.getElementById('waitlist-form');
  const messageEl = document.getElementById('form-message');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const cityInput = form.querySelector('#city');

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const city = cityInput?.value.trim() || null;

    // Reset validation errors
    let isValid = true;
    const nameError = form.querySelector('#name-error');
    const emailError = form.querySelector('#email-error');

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

    // Name check
    if (!name) {
      nameInput.classList.add('invalid');
      if (nameError) {
        nameError.textContent = 'Name is required';
        nameError.classList.add('visible');
      }
      isValid = false;
    }

    // Email check
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('invalid');
      if (emailError) {
        emailError.textContent = 'Please enter a valid email';
        emailError.classList.add('visible');
      }
      isValid = false;
    }

    if (!isValid) return;

    // If user is logged in, verify phone number first
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const userRow = await submitForm('getUser', { uid: firebaseUser.uid });
        const isVerified = userRow.exists && (
          userRow.user.PhoneVerified === true ||
          String(userRow.user.PhoneVerified).toLowerCase() === "true" ||
          String(userRow.user.PhoneVerified).toLowerCase() === "yes"
        );
        if (!isVerified) {
          // Trigger the existing verification flow (OTP guard modal)
          requirePhoneVerification(window.location.href);
          return;
        }
      } catch (err) {
        console.error("Error checking phone verification on submit:", err);
      }
    }

    // Set loading state
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Joining...';
    btn.disabled = true;

    try {
      // 1. Submit to Google Apps Script (REST API)
      await submitForm('waitlist', {
        name,
        email,
        destination_city: city
      });

      // 2. Dispatch Welcome Email via EmailJS
      try {
        emailjs.init("2eQPcf78ba9teOHLW");
        await emailjs.send("service_l0sibnb", "template_goz8c2o", {
          email: email
        });
        console.log("Welcome email sent successfully via EmailJS");
      } catch (emailErr) {
        console.error("EmailJS dispatch failed:", emailErr);
        // Do not fail the form submission if only EmailJS notifications failed
      }

      // Show success feedback
      showFormMessage("You're on the waitlist 🎉", 'success', messageEl);
      form.reset();
    } catch (err) {
      console.error('Waitlist submission failed:', err);
      showFormMessage('Something went wrong. Please try again.', 'error', messageEl);
    } finally {
      // Reset button state
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}
