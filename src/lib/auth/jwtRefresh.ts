import type { JWT } from "next-auth/jwt";

import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

/** How often the JWT is reconciled with MongoDB (session / jwt callback). */
export const JWT_DB_SYNC_MS = 5 * 60 * 1000;

type LeanUser = {
    username: string;
    email: string;
    isVerified: boolean;
    isAcceptingMessages: boolean;
};

/**
 * Refreshes JWT claims from the database. Sets `invalid` if the user no longer exists.
 */
export async function syncJwtFromDatabase(token: JWT): Promise<JWT> {
    const id = token.id;
    if (!id || typeof id !== "string") {
        return token;
    }

    await dbconnect();
    const doc = await UserModel.findById(id)
        .select("username email isVerified isAcceptingMessages")
        .lean<LeanUser | null>();

    if (!doc) {
        return { ...token, invalid: true };
    }

    return {
        ...token,
        invalid: false,
        name: doc.username,
        email: doc.email,
        username: doc.username,
        isVerified: doc.isVerified,
        isAcceptingMessages: doc.isAcceptingMessages,
        sessionRefreshedAt: Date.now(),
    };
}
