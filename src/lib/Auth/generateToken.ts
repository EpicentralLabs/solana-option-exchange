import jwt from 'jsonwebtoken';

/**
 * Generates a Personal Access Token (PAT) for a user.
 * 
 * @param {string} userId - The user ID for whom the token is generated.
 * @param {string} role - The role of the user (e.g., 'USER', 'ADMIN').
 * @returns {string} - The generated JWT token.
 * 
 * @throws {Error} - Throws an error if token generation fails.
 */
export const generateToken = (userId: string, role: string): string => {
  const payload = {
    userId,
    role,
  };

  const secretKey = process.env.JWT_SECRET_KEY;
  if (!secretKey) {
    console.error("JWT_SECRET_KEY is not set in the environment variables.");
    throw new Error('Secret key is missing.');
  }

  const expiresIn = '1d';

  try {
    return jwt.sign(payload, secretKey, { expiresIn });
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error('Failed to generate token');
  }
};
