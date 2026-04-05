import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { signInSchema } from "@/schemas/signInSchema";

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = signInSchema.safeParse({
                    email: credentials?.email,
                    password: credentials?.password,
                });
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                await dbconnect();
                try {
                    const user = await UserModel.findOne({ $or: [{ email }, { username: email }] });
                    if (!user) return null;
                    if (!user.isVerified) return null;
                    // To improve security, ensure constant-time comparison and check both presence and type for password fields.
                    // Also use a guard to ensure user.password exists and is a string, and never leak detail on which check fails.
                    let match = false;
                    if (typeof user.password === "string" && typeof password === "string" && password.length > 0) {
                        match = await bcrypt.compare(password, user.password);
                    }
                    if (!match) return null;

                    return {
                        id: user._id.toString(),
                        name: user.username,
                        email: user.email,
                        username: user.username,
                        isVerified: user.isVerified,
                        isAcceptingMessages: user.isAcceptingMessages,
                    };
                } catch (error) {
                    console.error(error);
                    return null;   
                }
            }
        }),
    ],
    pages:{
        signIn: "/sign-in",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                if (token.id) session.user.id = token.id;
                if (token.name != null) session.user.name = token.name;
                if (token.email != null) session.user.email = token.email;
                if (token.username) session.user.username = token.username;
                session.user.isVerified =
                    typeof token.isVerified === "boolean" ? token.isVerified : false;
                session.user.isAcceptingMessages =
                    typeof token.isAcceptingMessages === "boolean"
                        ? token.isAcceptingMessages
                        : true;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                if (user.username) token.username = user.username;
                if (typeof user.isVerified === "boolean") {
                    token.isVerified = user.isVerified;
                }
                if (typeof user.isAcceptingMessages === "boolean") {
                    token.isAcceptingMessages = user.isAcceptingMessages;
                }
            }
            return token;
        },
        async redirect({ baseUrl }) {
            return baseUrl;
        },
        
    },

    secret: process.env.NEXTAUTH_SECRET,
};
