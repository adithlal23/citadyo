import { listenForAuth } from "../auth/auth.js";
import { submitForm } from "../api/api.js";
import { generateSupportReply } from "../api/supportProvider.js";
import { requirePhoneVerification } from "./phoneGuard.js";
import "./support.css";

// Session & State Variables
let currentUser = null;
let conversationId = '';
let ticketId = '';
let currentCategory = 'General Support';

// DOM Cache
let widgetTrigger = null;
let widgetPanel = null;
let messagesContainer = null;
let chatInput = null;
let sendBtn = null;
let userBanner = null;
let greetingBubble = null;
let greetingAvatar = null;

/**
 * Generates a unique string ID with a prefix.
 * Used for session ConversationID and TicketID tracking.
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Escapes user input to prevent XSS issues while rendering newlines as <br>.
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

/**
 * Safely scroll the messages container to the bottom.
 */
function scrollToBottom() {
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

/**
 * Initializes a new chat session when the support window is opened for the first time.
 */
/**
 * Initializes a new chat session and renders the proactive companion home screen dashboard.
 */
function initChatSession() {
  conversationId = generateId('conv');
  ticketId = generateId('tkt');
  currentCategory = 'General Support';
  
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }

  // Determine user first name
  let firstName = 'there';
  if (currentUser) {
    firstName = (currentUser.displayName || currentUser.email || "Friend").split(" ")[0];
  }

  // Render Companion Home Screen
  const homeWrapper = document.createElement('div');
  homeWrapper.className = 'citadyo-home-wrapper';
  homeWrapper.innerHTML = `
    <div class="citadyo-home-greeting">
      Hi ${firstName} 👋<br>
      I'm <span>Cita</span> 💙<br>
      Your City Companion.
    </div>

    <div class="citadyo-cards-grid">
      <div class="citadyo-action-card" data-action="arrival-assistance">
        <span class="citadyo-card-icon">🚖</span>
        <span class="citadyo-card-title">I need Arrival Assistance</span>
        <span class="citadyo-card-desc">Airport transfer & local setup</span>
      </div>
      <div class="citadyo-action-card" data-action="accommodation">
        <span class="citadyo-card-icon">🏠</span>
        <span class="citadyo-card-title">I need Accommodation</span>
        <span class="citadyo-card-desc">Verified rentals & matching</span>
      </div>
      <div class="citadyo-action-card" data-action="settling-kit">
        <span class="citadyo-card-icon">📦</span>
        <span class="citadyo-card-title">I need a Settling Kit</span>
        <span class="citadyo-card-desc">Day 1 move-in essentials</span>
      </div>
      <div class="citadyo-action-card" data-action="ask-a-senior">
        <span class="citadyo-card-icon">🤝</span>
        <span class="citadyo-card-title">I want to Talk to a Senior</span>
        <span class="citadyo-card-desc">Connect with local students</span>
      </div>
      <div class="citadyo-action-card full-width" data-action="talk-team">
        <span class="citadyo-card-icon">💬</span>
        <div>
          <span class="citadyo-card-title" style="display:block; margin-bottom:2px;">Talk to Team</span>
          <span class="citadyo-card-desc">Get direct support from Citadyo</span>
        </div>
      </div>
    </div>

    <div class="citadyo-home-suggestions-header">Or ask me anything...</div>
    <div class="citadyo-chips-container">
      <button class="citadyo-suggested-chip" data-query="How does Arrival Assistance work?">How does Arrival Assistance work?</button>
      <button class="citadyo-suggested-chip" data-query="What does it cost?">What does it cost?</button>
      <button class="citadyo-suggested-chip" data-query="Which cities do you support?">Which cities do you support?</button>
      <button class="citadyo-suggested-chip" data-query="How do I become an Associate?">How do I become an Associate?</button>
    </div>
  `;

  messagesContainer.appendChild(homeWrapper);
  scrollToBottom();

  // Attach card click handlers
  homeWrapper.querySelectorAll('.citadyo-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.getAttribute('data-action');
      
      if (action === 'talk-team') {
        handleUserSubmit("💬 Talk to Team");
      } else {
        let url = '';
        if (action === 'arrival-assistance') url = '/arrival-assistance.html';
        if (action === 'accommodation') url = '/accommodation.html';
        if (action === 'settling-kit') url = '/settling-kits.html';
        if (action === 'ask-a-senior') url = '/ask-a-senior.html';
        
        if (url) {
          card.style.transform = 'scale(0.96)';
          setTimeout(() => {
            card.style.transform = '';
            window.location.href = url;
          }, 100);
        }
      }
    });
  });

  // Attach suggestions chips click handlers
  homeWrapper.querySelectorAll('.citadyo-suggested-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      
      // Clean up suggestion elements to keep log clean
      const sugHeader = homeWrapper.querySelector('.citadyo-home-suggestions-header');
      const sugChips = homeWrapper.querySelector('.citadyo-chips-container');
      if (sugHeader) sugHeader.remove();
      if (sugChips) sugChips.remove();
      
      handleUserSubmit(query);
    });
  });
}

/**
 * Appends a message bubble to the chat log.
 */
function addMessageBubble(text, sender) {
  if (!messagesContainer) return;

  const wrapper = document.createElement('div');
  wrapper.className = `citadyo-msg-wrapper ${sender}`;
  wrapper.innerHTML = `
    <div class="citadyo-msg-bubble">${escapeHTML(text)}</div>
  `;
  
  messagesContainer.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Appends interactive quick option buttons to the chat log.
 */
function addQuickOptions() {
  if (!messagesContainer) return;

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'citadyo-options-container';
  optionsContainer.innerHTML = `
    <button class="citadyo-option-btn" data-option="🚖 Arrival Assistance">🚖 Arrival Assistance</button>
    <button class="citadyo-option-btn" data-option="🏠 Accommodation">🏠 Accommodation</button>
    <button class="citadyo-option-btn" data-option="📦 Settling Kit">📦 Settling Kit</button>
    <button class="citadyo-option-btn" data-option="🤝 Ask a Senior">🤝 Ask a Senior</button>
    <button class="citadyo-option-btn" data-option="💬 Talk to Team">💬 Talk to Team</button>
  `;
  
  messagesContainer.appendChild(optionsContainer);
  scrollToBottom();

  optionsContainer.querySelectorAll('.citadyo-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const optionVal = btn.getAttribute('data-option');
      optionsContainer.remove();
      handleUserSubmit(optionVal);
    });
  });
}

/**
 * Posts the chat message payload to Google Apps Script ChatMessages sheet in background.
 */
function saveMessageToBackend(sender, messageText) {
  try {
    submitForm('saveChatMessage', {
      conversationId: conversationId,
      ticketId: ticketId,
      sender: sender,
      message: messageText,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("[Support] Failed to save chat message in background:", err);
  }
}

/**
 * Renders the bouncing typing indicator.
 */
function showTypingIndicator() {
  if (!messagesContainer) return;

  const indicator = document.createElement('div');
  indicator.id = 'citadyo-support-typing';
  indicator.className = 'citadyo-typing-indicator';
  indicator.innerHTML = `
    <div class="citadyo-typing-dot"></div>
    <div class="citadyo-typing-dot"></div>
    <div class="citadyo-typing-dot"></div>
  `;
  
  messagesContainer.appendChild(indicator);
  scrollToBottom();
}

/**
 * Removes the typing indicator.
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('citadyo-support-typing');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Email validation check.
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Renders the inline support ticket escalation form inside the message flow.
 */
function showEscalationForm(prefilledMessage = '') {
  if (!messagesContainer) return;

  // Disable the chat text input footer completely while the form is active
  if (chatInput) {
    chatInput.placeholder = "Please complete the form below...";
    chatInput.disabled = true;
    chatInput.value = '';
  }
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  const formWrapper = document.createElement('div');
  formWrapper.className = 'citadyo-escalation-form';

  let userBannerHtml = '';
  let guestFieldsHtml = '';

  if (currentUser) {
    userBannerHtml = `
      <div class="citadyo-form-group">
        <span class="citadyo-form-label">Logged-in Account</span>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent); padding: 4px 0;">
          ${currentUser.displayName || currentUser.email} (${currentUser.email})
        </div>
      </div>
      <div class="citadyo-form-group">
        <label class="citadyo-form-label" for="citadyo-form-phone">Phone Number</label>
        <input type="tel" id="citadyo-form-phone" class="citadyo-form-input" placeholder="e.g. +91 9876543210" value="${currentUser.phoneNumber || ''}">
      </div>
    `;
  } else {
    guestFieldsHtml = `
      <div class="citadyo-form-group">
        <label class="citadyo-form-label" for="citadyo-form-name">Your Name</label>
        <input type="text" id="citadyo-form-name" class="citadyo-form-input" placeholder="Enter your full name">
      </div>
      <div class="citadyo-form-group">
        <label class="citadyo-form-label" for="citadyo-form-email">Your Email</label>
        <input type="email" id="citadyo-form-email" class="citadyo-form-input" placeholder="e.g. name@example.com">
      </div>
      <div class="citadyo-form-group">
        <label class="citadyo-form-label" for="citadyo-form-phone">Phone Number</label>
        <input type="tel" id="citadyo-form-phone" class="citadyo-form-input" placeholder="e.g. +91 9876543210">
      </div>
    `;
  }

  formWrapper.innerHTML = `
    <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; display: block;">
      💙 Talk to Citadyo Team
    </span>
    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 10px 0; line-height: 1.4;">
      Please fill out this quick form so our team members can connect with you directly.
    </p>

    <div class="citadyo-form-alert" id="citadyo-form-error"></div>

    ${userBannerHtml}
    ${guestFieldsHtml}

    <div class="citadyo-form-group">
      <span class="citadyo-form-label">Preferred Contact Method</span>
      <div class="citadyo-pref-buttons">
        <button type="button" class="citadyo-pref-btn" data-pref="Call Me">
          <span class="citadyo-pref-icon">📞</span>
          <span>Call Me</span>
        </button>
        <button type="button" class="citadyo-pref-btn" data-pref="WhatsApp Me">
          <span class="citadyo-pref-icon">💬</span>
          <span>WhatsApp Me</span>
        </button>
        <button type="button" class="citadyo-pref-btn active" data-pref="Email Me">
          <span class="citadyo-pref-icon">✉️</span>
          <span>Email Me</span>
        </button>
      </div>
    </div>

    <div class="citadyo-form-group">
      <label class="citadyo-form-label" for="citadyo-form-msg">Message</label>
      <textarea id="citadyo-form-msg" class="citadyo-form-textarea" placeholder="Explain what you need assistance with...">${prefilledMessage}</textarea>
    </div>

    <button type="button" id="citadyo-form-submit-btn" class="citadyo-form-submit">
      Submit Support Request
    </button>
  `;

  messagesContainer.appendChild(formWrapper);
  scrollToBottom();

  // Contact Method Preferences Toggle logic
  let selectedPref = 'Email Me';
  const prefBtns = formWrapper.querySelectorAll('.citadyo-pref-btn');
  prefBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      prefBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPref = btn.getAttribute('data-pref');
    });
  });

  const submitBtn = formWrapper.querySelector('#citadyo-form-submit-btn');
  const errorAlert = formWrapper.querySelector('#citadyo-form-error');

  submitBtn.addEventListener('click', async () => {
    errorAlert.style.display = 'none';

    // Retrieve input elements
    const phoneInput = formWrapper.querySelector('#citadyo-form-phone');
    const msgInput = formWrapper.querySelector('#citadyo-form-msg');

    let name = '';
    let email = '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const message = msgInput ? msgInput.value.trim() : '';

    if (currentUser) {
      name = currentUser.displayName || currentUser.email.split('@')[0];
      email = currentUser.email;
    } else {
      const nameInput = formWrapper.querySelector('#citadyo-form-name');
      const emailInput = formWrapper.querySelector('#citadyo-form-email');
      
      name = nameInput ? nameInput.value.trim() : '';
      email = emailInput ? emailInput.value.trim() : '';
    }

    // Form validation rules
    if (!name) {
      showError("Please enter your name.");
      return;
    }

    if (!email || !validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    if ((selectedPref === 'Call Me' || selectedPref === 'WhatsApp Me') && !phone) {
      showError(`Phone number is required to contact you via ${selectedPref.split(' ')[0]}.`);
      return;
    }

    if (!message) {
      showError("Please enter a message description.");
      return;
    }

    // Lock UI during API submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    formWrapper.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);

    try {
      const payload = {
        ticketId: ticketId,
        uid: currentUser ? currentUser.uid : 'Guest',
        name: name,
        email: email,
        phone: phone || 'N/A',
        contactMethod: selectedPref,
        category: currentCategory,
        message: message,
        currentPage: window.location.href
      };

      await submitForm('supportRequest', payload);

      // Render success screen inside form container
      formWrapper.innerHTML = `
        <div style="text-align: center; padding: 12px 0; animation: supportMsgFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;">
          <div style="font-size: 2.25rem; margin-bottom: 8px;">💙</div>
          <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Thanks 💙</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
            A Citadyo team member will contact you shortly.
          </p>
        </div>
      `;

      // Restore and reset standard chat bar inputs for future messaging
      if (chatInput) {
        chatInput.placeholder = "Type a message...";
        chatInput.disabled = false;
        chatInput.focus();
      }
      
      // Roll a new Ticket ID for subsequent submissions in this session
      ticketId = generateId('tkt');

    } catch (err) {
      console.error("[Support] Submit failed:", err);
      showError("Submission failed. Please check your network or email us directly at citadyo.official@gmail.com.");
      
      // Re-enable form fields
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Support Request';
      formWrapper.querySelectorAll('input, textarea, button').forEach(el => {
        if (el !== submitBtn) el.disabled = false;
      });
    }
  });

  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.style.display = 'block';
    scrollToBottom();
  }
}

/**
 * Handle user messages - display message, log to Apps Script, fetch reply from Provider.
 */
async function handleUserSubmit(text) {
  if (!text || text.trim() === '') return;

  const msgText = text.trim();

  // 1. Display User bubble
  addMessageBubble(msgText, 'user');

  // 2. Save User message to Google Sheets
  saveMessageToBackend('user', msgText);

  // 3. Reset input field
  if (chatInput) {
    chatInput.value = '';
  }
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  // 4. Show typing animation
  showTypingIndicator();

  // 5. Disable input temporarily while generating reply
  if (chatInput) chatInput.disabled = true;

  try {
    // 6. Query Provider
    const result = await generateSupportReply(msgText);

    // Hide typing dots
    hideTypingIndicator();

    currentCategory = result.category;

    if (result.type === 'service' || result.type === 'info') {
      // Show Bot reply bubble
      addMessageBubble(result.message, 'bot');

      // Save Bot reply to Google Sheets
      saveMessageToBackend('bot', result.message);

      // Render smart CTA button if service action exists
      if (result.type === 'service' && result.action) {
        addSmartCta(result.action);
      }

      // Restore inputs
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.focus();
      }
    } else if (result.type === 'escalation') {
      // Fallback: Show inline Contact Form
      showEscalationForm(msgText);
    }
  } catch (err) {
    console.error("[Support] Reply execution failed:", err);
    hideTypingIndicator();
    showEscalationForm(msgText);
  }
}

/**
 * Renders a smart CTA redirect button guarded by Phone Verification.
 */
function addSmartCta(action) {
  if (!messagesContainer) return;
  
  let label = '';
  let url = '';
  
  if (action === 'arrival-assistance') {
    label = 'Book Arrival Assistance 🚖';
    url = '/arrival-assistance.html';
  } else if (action === 'accommodation') {
    label = 'Explore Accommodation 🏠';
    url = '/accommodation.html';
  } else if (action === 'settling-kit') {
    label = 'Order Settling Kit 📦';
    url = '/settling-kits.html';
  } else if (action === 'ask-a-senior') {
    label = 'Talk to a Senior 🤝';
    url = '/ask-a-senior.html';
  }
  
  if (!label || !url) return;
  
  const ctaWrapper = document.createElement('div');
  ctaWrapper.className = 'citadyo-cta-wrapper';
  ctaWrapper.innerHTML = `
    <button class="citadyo-cta-btn" type="button">
      ${label}
    </button>
  `;
  
  messagesContainer.appendChild(ctaWrapper);
  scrollToBottom();
  
  const btn = ctaWrapper.querySelector('.citadyo-cta-btn');
  btn.addEventListener('click', () => {
    btn.style.transform = 'scale(0.96)';
    setTimeout(() => {
      btn.style.transform = '';
      window.location.href = url;
    }, 80);
  });
}

/**
 * Dynamically updates the user banner identity block when authorization state changes.
 */
function updateUserContext(user) {
  currentUser = user;

  if (userBanner) {
    if (user) {
      userBanner.innerHTML = `
        <span style="display:inline-block; width:6px; height:6px; background-color:#10b981; border-radius:50%;"></span>
        Logged in as ${user.displayName || user.email}
      `;
      userBanner.style.display = 'flex';
    } else {
      userBanner.style.display = 'none';
    }
  }

  // Auto-init the welcome greeting on state updates if window is active and log is empty
  if (messagesContainer && messagesContainer.innerHTML === '' && widgetPanel && widgetPanel.classList.contains('active')) {
    initChatSession();
  }
}

function setupEventHandlers() {
  if (!widgetTrigger || !widgetPanel || !chatInput || !sendBtn) return;

  let greetingBubbleDismissed = false;

  const openChatbot = () => {
    const isOpening = !widgetPanel.classList.contains('active');
    
    if (isOpening) {
      widgetPanel.classList.add('active');
      widgetTrigger.classList.add('hidden');
      
      // Hide greeting bubble when chatbot opens
      if (greetingBubble) {
        greetingBubble.classList.add('hidden');
        greetingBubbleDismissed = true;
      }
      
      // Initialize a new session ID if empty
      if (!conversationId) {
        initChatSession();
      } else {
        setTimeout(scrollToBottom, 50);
      }
      
      setTimeout(() => chatInput.focus(), 150);
    }
  };

  // Toggle Support Window via trigger button (which is the Cita avatar)
  widgetTrigger.addEventListener('click', openChatbot);

  // Click on greeting bubble opens chatbot too
  if (greetingBubble) {
    greetingBubble.addEventListener('click', openChatbot);
  }

  // Close Support Window
  const closeBtn = document.getElementById('citadyo-support-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      widgetPanel.classList.remove('active');
      widgetTrigger.classList.remove('hidden');
    });
  }

  // Hover/Tap interactions on Cita avatar to make the greeting bubble reappear
  widgetTrigger.addEventListener('mouseenter', () => {
    if (greetingBubble && !widgetPanel.classList.contains('active')) {
      greetingBubble.classList.remove('hidden');
    }
  });

  widgetTrigger.addEventListener('mouseleave', () => {
    if (greetingBubble && greetingBubbleDismissed && !widgetPanel.classList.contains('active')) {
      greetingBubble.classList.add('hidden');
    }
  });

  widgetTrigger.addEventListener('touchstart', () => {
    if (greetingBubble && greetingBubble.classList.contains('hidden') && !widgetPanel.classList.contains('active')) {
      greetingBubble.classList.remove('hidden');
    }
  }, { passive: true });

  // Handle Input Changes (enable/disable send button)
  chatInput.addEventListener('input', () => {
    sendBtn.disabled = (chatInput.value.trim() === '');
  });

  // Handle Send click
  sendBtn.addEventListener('click', () => {
    handleUserSubmit(chatInput.value);
  });

  // Handle Enter keypress
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
      handleUserSubmit(chatInput.value);
    }
  });

  // Auto-dismiss only the greeting speech bubble after 9 seconds
  setTimeout(() => {
    if (greetingBubble && !widgetPanel.classList.contains('active')) {
      greetingBubble.classList.add('hidden');
      greetingBubbleDismissed = true;
    }
  }, 9000);
}

/**
 * Initializes the Support System elements and loads context observers.
 * Safely checks for existing injections to avoid duplicate rendering.
 */
export function initSupport() {
  if (document.getElementById('citadyo-support-root')) {
    return;
  }

  // Create Container Root
  const root = document.createElement('div');
  root.id = 'citadyo-support-root';
  root.className = 'citadyo-support-root';
  root.innerHTML = `
    <!-- Cita Greeting Speech Bubble -->
    <div id="citadyo-greeting-bubble" class="citadyo-greeting-bubble">
      <div class="citadyo-greeting-text">
        <strong>Hi! I'm Cita 💙</strong><br>
        Need any help?
      </div>
    </div>

    <!-- Cita Greeting Avatar (Main Floating Trigger) -->
    <div id="citadyo-greeting-avatar" class="citadyo-greeting-avatar">
      <img src="/cita_avatar.png" alt="Cita Avatar">
    </div>

    <!-- Support Window Widget -->
    <div id="citadyo-support-window" class="citadyo-support-panel">
      <!-- Signed-in Banner -->
      <div id="citadyo-support-banner" class="citadyo-support-user-banner" style="display: none;"></div>

      <!-- Header -->
      <div class="citadyo-support-header">
        <div class="citadyo-support-brand">
          <h3 class="citadyo-support-title">💙 Cita</h3>
          <span class="citadyo-support-subheading">Your City Companion</span>
        </div>
        <button id="citadyo-support-close-btn" class="citadyo-support-close" title="Close Panel">
          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Chat Log Messages -->
      <div id="citadyo-support-log" class="citadyo-support-messages"></div>

      <!-- Chat Input Area -->
      <div class="citadyo-support-input-bar">
        <input type="text" id="citadyo-support-input" class="citadyo-support-text-input" placeholder="Type a message..." autocomplete="off">
        <button id="citadyo-support-send" class="citadyo-support-send-btn" disabled title="Send Message">
          <svg viewBox="0 0 24 24" stroke="none">
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Cache DOM references
  widgetTrigger = document.getElementById('citadyo-greeting-avatar'); // Set trigger to avatar
  widgetPanel = document.getElementById('citadyo-support-window');
  messagesContainer = document.getElementById('citadyo-support-log');
  chatInput = document.getElementById('citadyo-support-input');
  sendBtn = document.getElementById('citadyo-support-send');
  userBanner = document.getElementById('citadyo-support-banner');
  greetingBubble = document.getElementById('citadyo-greeting-bubble');
  greetingAvatar = document.getElementById('citadyo-greeting-avatar');

  // Setup Event Listeners
  setupEventHandlers();

  // Listen to Auth State changes globally
  listenForAuth((user) => {
    updateUserContext(user);
  });
}


