import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            username?: string;
            isVerified: boolean;
            isAcceptingMessages: boolean;
        };
    }

    interface User {
        username?: string;
        isVerified?: boolean;
        isAcceptingMessages?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        username?: string;
        isVerified?: boolean;
        isAcceptingMessages?: boolean;
    }
}
