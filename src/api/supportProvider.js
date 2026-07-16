/**
 * Citadyo Support System - AI / Simulated Provider Interface
 * Easy to replace later with real AI integrations (e.g. Gemini, OpenAI)
 */

/**
 * Generates a structured support reply based on the message content.
 * Simulates a small latency to look natural (typing indicator).
 * 
 * Supported types:
 * - 'service': Recommends a Citadyo service and includes a CTA action.
 * - 'info': Provides helpful static information without a primary redirect CTA.
 * - 'escalation': Signals the UI to present the contact request form.
 * 
 * @param {string} message - The message input from the user.
 * @returns {Promise<{type: 'service'|'info'|'escalation', message: string, action?: string, category: string}>} Structured reply details
 */
export async function generateSupportReply(message) {
  // Simulate network delay / typing latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const msg = (message || '').toLowerCase().trim();
  
  // Suggested Chip: How does Arrival Assistance work? / general Arrival queries
  if (msg.includes('arrival') || msg.includes('assistance') || msg.includes('🚖') || msg.includes('airport') || msg.includes('pickup')) {
    return {
      type: "service",
      message: "Arrival Assistance helps you settle in on Day 1. We arrange airport/station pickups with verified drivers, handle baggage, and guide you directly to your accommodation. Standard packages start at ₹1,999.",
      action: "arrival-assistance",
      category: "Arrival Assistance"
    };
  }
  
  // Suggested Chip: Accommodation queries / rental / roommate search
  if (msg.includes('accommodation') || msg.includes('rental') || msg.includes('🏠') || msg.includes('housing') || msg.includes('flat') || msg.includes('room')) {
    return {
      type: "service",
      message: "We find trusted, verified rentals near your university or office. We also assist with lease validation, landlord negotiations, and roommate matchmaking to make moving painless.",
      action: "accommodation",
      category: "Accommodation"
    };
  }
  
  // Suggested Chip: Settling Kit queries
  if (msg.includes('settling') || msg.includes('kit') || msg.includes('📦') || msg.includes('essentials')) {
    return {
      type: "service",
      message: "Our Settling Kits prepare you for local life immediately. They include pre-activated local SIM cards, public transport cards (preloaded), bathroom essentials, and regional snacks delivered straight to you.",
      action: "settling-kit",
      category: "Settling Kit"
    };
  }
  
  // Suggested Chip: Ask a Senior / talk to senior / local guides
  if (msg.includes('senior') || msg.includes('ask') || msg.includes('🤝') || msg.includes('locals') || msg.includes('connect')) {
    return {
      type: "service",
      message: "Ask a Senior matches you with experienced seniors or local guides already living in your destination city. Get honest answers to university hacks, safe neighborhoods, and budget life tips.",
      action: "ask-a-senior",
      category: "Ask a Senior"
    };
  }
  
  // Suggested Chip: What does it cost?
  if (msg.includes('cost') || msg.includes('price') || msg.includes('pricing') || msg.includes('fee') || msg.includes('charges')) {
    return {
      type: "info",
      message: "Citadyo dashboard and search is completely free. Premium services like Arrival Assistance start at ₹1,999, and Settling Kits start at ₹999. Landlord rental placement fees vary based on duration.",
      category: "General Support"
    };
  }
  
  // Suggested Chip: Which cities do you support?
  if (msg.includes('cities') || msg.includes('where') || msg.includes('location') || msg.includes('places') || msg.includes('supported')) {
    return {
      type: "info",
      message: "We currently support transitions to Bengaluru, Mumbai, Pune, Delhi NCR, and Chennai. We are adding new cities every month to make relocation easier across India!",
      category: "General Support"
    };
  }
  
  // Suggested Chip: How do I become an Associate?
  if (msg.includes('become') || msg.includes('associate') || msg.includes('work') || msg.includes('join') || msg.includes('job') || msg.includes('career')) {
    return {
      type: "info",
      message: "Earn money by helping newcomers settle in! If you are a senior student or resident, you can apply to become a Citadyo Associate. Flexible hours, extra income, and networking. Click 'Explore Roles' under the 'For Seniors' section of the homepage.",
      category: "General Support"
    };
  }
  
  // Explicit request to speak with the team
  if (msg.includes('talk to team') || msg.includes('talk to the team') || msg.includes('team') || msg.includes('chat with team') || msg.includes('💬') || msg.includes('contact')) {
    return {
      type: "escalation",
      message: "Sure, let's get you in touch with a Citadyo team member.",
      category: "Talk to Team"
    };
  }
  
  // If the query cannot be answered automatically, fallback to showing the support request form
  return {
    type: "escalation",
    message: "I couldn't find an automatic answer for that. Let me connect you with our support team.",
    category: "General Support"
  };
}
