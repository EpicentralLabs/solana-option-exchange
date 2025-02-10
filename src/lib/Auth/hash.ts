import argon2 from 'argon2';

/**
 * Hashes a password using Argon2id with specified security parameters.
 *
 * @param {string} password - The plain-text password to be hashed.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 * @throws {Error} - Throws an error if the password is not valid or if hashing fails.
 *
 * @example
 * ```ts
 * const hashedPassword = await hashPassword("securePassword123!");
 * console.log(hashedPassword);
 * ```
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (typeof password !== 'string' || password.trim().length < 8 || password.length > 64) {
    throw new Error('Password must be between 8 and 64 characters long.');
  }

  try {
    return await argon2.hash(password, { 
      type: argon2.argon2id, 
      memoryCost: 65536, 
      timeCost: 3, 
      parallelism: 2 
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error hashing password:', error.message);
    } else {
      console.error('Unknown error occurred while hashing password.');
    }
    throw new Error('Internal server error. Please try again.');
  }
};
