import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { JWT_DB_SYNC_MS, syncJwtFromDatabase } from "@/lib/auth/jwtRefresh";
import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { signInSchema } from "@/schemas/signInSchema";

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
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
                    const user = await UserModel.findOne({
                        $or: [{ email }, { username: email }],
                    });
                    if (!user) return null;
                    if (!user.isVerified) return null;
                    let match = false;
                    if (
                        typeof user.password === "string" &&
                        typeof password === "string" &&
                        password.length > 0
                    ) {
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
            },
        }),
    ],
    pages: {
        signIn: "/sign-in",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                if (token.invalid) {
                    session.user.isVerified = false;
                }
                if (token.id) session.user.id = token.id;
                if (token.name != null) session.user.name = token.name;
                if (token.email != null) session.user.email = token.email;
                if (token.username) session.user.username = token.username;
                session.user.isVerified =
                    typeof token.isVerified === "boolean"
                        ? token.isVerified
                        : false;
                session.user.isAcceptingMessages =
                    typeof token.isAcceptingMessages === "boolean"
                        ? token.isAcceptingMessages
                        : true;
            }
            return session;
        },
        async jwt({ token, user, trigger }) {
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
                token.sessionRefreshedAt = Date.now();
                token.invalid = false;
                return token;
            }

            if (token.invalid) {
                return token;
            }

            const id = token.id;
            if (!id || typeof id !== "string") {
                return token;
            }

            const last =
                typeof token.sessionRefreshedAt === "number"
                    ? token.sessionRefreshedAt
                    : 0;
            const shouldRefresh =
                trigger === "update" || Date.now() - last > JWT_DB_SYNC_MS;

            if (!shouldRefresh) {
                return token;
            }

            try {
                return await syncJwtFromDatabase(token);
            } catch (error) {
                console.error("[auth] JWT database sync failed:", error);
                return token;
            }
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            try {
                const next = new URL(url);
                if (next.origin === baseUrl) {
                    return url;
                }
            } catch {
                /* ignore */
            }
            return baseUrl;
        },
    },

    secret: authSecret,
};
