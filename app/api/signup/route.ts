import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Email, password, and confirm password are required" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Signup Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
