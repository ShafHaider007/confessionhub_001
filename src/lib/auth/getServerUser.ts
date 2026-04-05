import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

/** Live user fields for authorization (no password). */
export type AuthUserSnapshot = {
    username: string;
    email: string;
    isVerified: boolean;
    isAcceptingMessages: boolean;
};

/**
 * Session from the cookie plus current DB fields. Use for APIs that must honor live flags.
 */
export async function getServerUser(): Promise<{
    session: Awaited<ReturnType<typeof getServerSession>>;
    user: AuthUserSnapshot | null;
}> {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (!id) {
        return { session, user: null };
    }

    await dbconnect();
    const row = await UserModel.findById(id)
        .select("username email isVerified isAcceptingMessages")
        .lean<AuthUserSnapshot | null>();

    if (!row) {
        return { session, user: null };
    }

    return { session, user: row };
}
