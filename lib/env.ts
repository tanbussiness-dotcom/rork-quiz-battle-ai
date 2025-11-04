/**
 * Environment variable access utility
 * This file helps manage environment variables across client and server contexts
 */

/**
 * Get GEMINI_API_KEY - only available server-side
 * @returns API key or null if not available
 */
export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    console.warn('[Env] GEMINI_API_KEY should not be accessed from client side');
    return null;
  }
  
  return process.env.GEMINI_API_KEY || null;
}

/**
 * Validate that required server-side environment variables are present
 * @throws Error if required variables are missing
 */
export function validateServerEnv(): void {
  if (typeof window !== 'undefined') {
    return;
  }
  
  const required = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('📝 Please ensure these are set in your env file:');
    missing.forEach(key => console.error(`   - ${key}`));
  }
}

// Run validation on module load (server-side only)
if (typeof window === 'undefined') {
  validateServerEnv();
}
