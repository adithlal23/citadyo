/**
 * Citadyo Frontend API Utility
 * Communicates with the Google Apps Script Web App
 */

export const CONFIG = {
  // Loaded from Vite environment variables, with a placeholder fallback
  apiUrl: import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbz_fallback_placeholder/exec'
};

/**
 * Submits form data to the Google Apps Script backend.
 * Uses Content-Type: text/plain to bypass browser CORS preflight (OPTIONS) requests
 * since Google Apps Script does not natively handle preflights.
 * 
 * @param {string} action - The action endpoint (e.g., 'waitlist', 'investor')
 * @param {object} data - The form data payload
 * @returns {Promise<object>} JSON response from the server
 */
export async function submitForm(action, data) {
  try {
    const payload = {
      action,
      ...data
    };

    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain' // Crucial to prevent CORS preflight check errors
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Backend returned an unsuccessful response');
    }

    return result;
  } catch (error) {
    console.error(`API execution failed for action [${action}]:`, error);
    throw error;
  }
}
