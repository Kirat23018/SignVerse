/**
 * SignVerse Credit & Subscription Manager
 * Handles 3-Day Free Trial, Credit Balance, and Monthly ($5) / Annual ($60) Plans.
 */

const STORAGE_KEYS = {
  PLAN: 'signverse_plan',
  CREDITS: 'signverse_credits',
  TRIAL_START: 'signverse_trial_start',
  SUBSCRIPTION_EXPIRY: 'signverse_sub_expiry'
};

const TRIAL_DURATION_DAYS = 3;
const DEFAULT_TRIAL_CREDITS = 50;

/**
 * Initialize or get user's subscription and credit status
 */
export function getSubscriptionStatus() {
  let plan = localStorage.getItem(STORAGE_KEYS.PLAN);
  let credits = localStorage.getItem(STORAGE_KEYS.CREDITS);
  let trialStart = localStorage.getItem(STORAGE_KEYS.TRIAL_START);

  // First time user setup -> 3-Day Free Trial with 50 credits
  if (!trialStart) {
    trialStart = Date.now().toString();
    plan = 'Free Trial (3 Days)';
    credits = DEFAULT_TRIAL_CREDITS.toString();

    localStorage.setItem(STORAGE_KEYS.TRIAL_START, trialStart);
    localStorage.setItem(STORAGE_KEYS.PLAN, plan);
    localStorage.setItem(STORAGE_KEYS.CREDITS, credits);
  }

  const startTime = parseInt(trialStart, 10);
  const now = Date.now();
  const elapsedDays = (now - startTime) / (1000 * 60 * 60 * 24);
  const trialDaysRemaining = Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - elapsedDays));
  const isTrialActive = plan.includes('Trial') && trialDaysRemaining > 0;
  const isPaidPlan = plan.includes('$5') || plan.includes('$60') || plan.includes('Pro');
  const isExpired = !isPaidPlan && trialDaysRemaining === 0;

  return {
    plan: isExpired ? 'Trial Expired' : plan,
    credits: parseInt(credits || '0', 10),
    trialDaysRemaining,
    isTrialActive,
    isPaidPlan,
    isExpired,
    totalTrialDays: TRIAL_DURATION_DAYS
  };
}

/**
 * Deduct credits for AI actions (Translate, AI Chatbot)
 */
export function deductCredits(amount = 1) {
  const status = getSubscriptionStatus();

  // Paid users have unlimited translations
  if (status.isPaidPlan) {
    return { success: true, remainingCredits: status.credits, isUnlimited: true };
  }

  if (status.isExpired) {
    return { 
      success: false, 
      message: 'Your 3-Day Free Trial has expired. Please upgrade to Pro Monthly ($5) or Pro Annual ($60) to continue.',
      requireUpgrade: true 
    };
  }

  if (status.credits < amount) {
    return { 
      success: false, 
      message: 'Insufficient AI credits. Please upgrade your plan for unlimited access!',
      requireUpgrade: true 
    };
  }

  const newCredits = status.credits - amount;
  localStorage.setItem(STORAGE_KEYS.CREDITS, newCredits.toString());
  
  return { 
    success: true, 
    remainingCredits: newCredits, 
    isUnlimited: false 
  };
}

// Backward compatibility alias
export const useCredits = deductCredits;

/**
 * Add credits
 */
export function addCredits(amount = 50) {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.CREDITS) || '0', 10);
  const updated = current + amount;
  localStorage.setItem(STORAGE_KEYS.CREDITS, updated.toString());
  return updated;
}

/**
 * Upgrade to Paid Plan ($5/mo or $60/yr)
 */
export function upgradeSubscription(planType) {
  // planType: 'monthly' | 'yearly'
  if (planType === 'monthly') {
    localStorage.setItem(STORAGE_KEYS.PLAN, 'Pro Monthly ($5/mo)');
    localStorage.setItem(STORAGE_KEYS.CREDITS, '500');
  } else if (planType === 'yearly') {
    localStorage.setItem(STORAGE_KEYS.PLAN, 'Pro Annual ($60/yr)');
    localStorage.setItem(STORAGE_KEYS.CREDITS, '9999');
  }

  const expiryDate = Date.now() + (planType === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY, expiryDate.toString());

  return getSubscriptionStatus();
}

/**
 * Check if the user has unlocked Pro features or courses
 */
export function isProUnlocked() {
  const status = getSubscriptionStatus();
  if (status.isPaidPlan) return true;
  return localStorage.getItem('signverse_pro_unlocked') === 'true';
}

/**
 * Unlock Pro Course Subscription (e.g. ₹199/month or ₹1499/year)
 */
export function unlockProCourseSubscription(planDetails = 'Pro Tier (₹199/mo)') {
  localStorage.setItem(STORAGE_KEYS.PLAN, planDetails);
  localStorage.setItem('signverse_pro_unlocked', 'true');
  localStorage.setItem(STORAGE_KEYS.CREDITS, '9999');
  const expiryDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY, expiryDate.toString());
  window.dispatchEvent(new CustomEvent('signverse_subscription_updated'));
  return getSubscriptionStatus();
}

/**
 * Reset Free Trial (Useful for testing)
 */
export function resetFreeTrial() {
  localStorage.setItem(STORAGE_KEYS.TRIAL_START, Date.now().toString());
  localStorage.setItem(STORAGE_KEYS.PLAN, 'Free Trial (3 Days)');
  localStorage.setItem(STORAGE_KEYS.CREDITS, DEFAULT_TRIAL_CREDITS.toString());
  localStorage.removeItem('signverse_pro_unlocked');
  window.dispatchEvent(new CustomEvent('signverse_subscription_updated'));
  return getSubscriptionStatus();
}
