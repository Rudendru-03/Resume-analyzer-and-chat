import crypto from "crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });

  return `${ITERATIONS}:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<boolean> {
  const [iterations, salt, originalHash] = storedPassword.split(":");

  if (!iterations || !salt || !originalHash) {
    return false;
  }

  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      Number(iterations),
      KEY_LENGTH,
      DIGEST,
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });

  return crypto.timingSafeEqual(
    Buffer.from(originalHash, "hex"),
    Buffer.from(hash.toString("hex"), "hex"),
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email }).lean<{
          _id: unknown;
          email: string;
          passwordHash: string;
        } | null>();

        if (!user) {
          return null;
        }

        const isValidPassword = await verifyPassword(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: String(user._id),
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }

      return session;
    },
  },
};
