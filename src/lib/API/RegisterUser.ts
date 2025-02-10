import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from "../Auth/hash";
import { generateToken  } from "@/lib/Auth/generateToken";

const prisma = new PrismaClient();

/**
 * Validates the format of an email address.
 * 
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email format is valid, otherwise false.
 */
const isValidEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Validates the format of a username.
 * 
 * @param {string} username - The username to validate.
 * @returns {boolean} - Returns true if the username is valid (only letters, numbers, and underscores, 3-20 chars), otherwise false.
 */
const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
};

/**
 * Registers a new user by validating input and creating a new user record in the database.
 * 
 * @param {string} username - The desired username for the new user.
 * @param {string} password - The desired password for the new user.
 * @param {string} email - The desired email for the new user.
 * @returns {Promise<void>} - A promise that resolves when the user is successfully registered or if an error occurs.
 * 
 * @throws {Error} - Throws an error if registration fails due to invalid input or internal server issues.
 */
export const registerUser = async (username: string, password: string, email: string): Promise<void> => {
  if (!username || !password || !email) {
    console.error("Username, password, and email are required.");
    return;
  }

  if (!isValidUsername(username)) {
    console.error("Invalid username. Only letters, numbers, and underscores are allowed (3-20 chars).");
    return;
  }

  if (!isValidEmail(email)) {
    console.error("Invalid email format.");
    return;
  }

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    console.log("User registered successfully:", user);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during user registration:", error.message);
    } else {
      console.error("Unknown error during user registration.");
    }
  } finally {
    await prisma.$disconnect();
  }
};
