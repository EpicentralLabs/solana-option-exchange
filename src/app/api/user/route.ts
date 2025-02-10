import { prisma } from "@/lib/prisma";
import { PrismaClient, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/Auth/verifyToken";
import { generateToken } from "@/lib/Auth/generateToken";
import { hashPassword } from "@/lib/Auth/hash";

/**
 * Handles GET requests to fetch all users if the requesting user is an admin.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    const decoded = verifyToken(token);
    const userId = (decoded as any).userId;

    // Check if the token exists in DB and is still valid
    const dbToken = await prisma.tokens.findFirst({
      where: { token, userId },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Unauthorized - Invalid or expired token" }, { status: 401 });
    }

    if (dbToken.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Handles POST requests to register a new user with a hashed password.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { username, password, email } = body;

    if (!username || !password || !email) {
      return NextResponse.json({ error: "Username, password, and email are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already taken." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    // Revoke previous tokens
    await prisma.token.deleteMany({ where: { userId: user.id } });

    // Generate a token for the new user
    const token = generateToken(user.id.toString(), user.role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1-day expiration

    // Store token in database
    await prisma.token.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({ message: "User registered successfully.", userId: user.id, token }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
