/**
 * Validation utility functions for form inputs
 */

/**
 * Email validation regex
 * This pattern validates most common email formats:
 * - Must have characters before and after the @ symbol
 * - Must have a valid domain with at least one period
 * - Allows letters, numbers, underscores, periods, and hyphens in the local part
 * - Allows letters, numbers, periods, and hyphens in the domain part
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Get descriptive error message for invalid email
 * @returns {string} Error message explaining requirements for valid email
 */
export const getEmailErrorMessage = () => {
  return "Please enter a valid email address";
};

export default {
  isValidEmail,
  getEmailErrorMessage,
}; 