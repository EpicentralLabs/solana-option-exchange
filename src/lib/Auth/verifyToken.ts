import jwt from 'jsonwebtoken';

/**
 * Verifies the validity of the provided token.
 * 
 * @param {string} token - The JWT token to be verified.
 * @returns {object} - The decoded token payload if valid, otherwise throws an error.
 * 
 * @throws {Error} - Throws an error if the token is invalid or expired.
 */
export const verifyToken = (token: string): object => {
  const secretKey = process.env.JWT_SECRET_KEY;
  
  if (!secretKey) {
    console.error("JWT_SECRET_KEY is not set in the environment variables.");
    throw new Error('JWT secret key is missing.');
  }

  try {
    return jwt.verify(token, secretKey) as object;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token has expired");
      throw new Error('Token has expired');
    }

    console.error("Token verification failed:", error);
    throw new Error('Invalid or expired token');
  }
};
