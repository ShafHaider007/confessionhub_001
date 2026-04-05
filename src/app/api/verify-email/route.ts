import { timingSafeEqual } from "crypto";

import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {
    normalizeVerifyCode,
    verifyEmailSchema,
} from "@/schemas/verifySchema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    await dbconnect();
    try {
        const body = await request.json();
        const parsed = verifyEmailSchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return NextResponse.json(
                { success: false, message: first?.message ?? "Invalid input" },
                { status: 400 },
            );
        }

        const email = parsed.data.email;
        const code = normalizeVerifyCode(parsed.data.code);

        const user = await UserModel.findOne({ email });
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No account found for this email. please sign up first.",
                    errorCode: "NOT_FOUND" as const,
                },
                { status: 404 },
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This email is already verified. You can sign in.",
                    errorCode: "ALREADY_VERIFIED" as const,
                },
                { status: 400 },
            );
        }

        const now = new Date();
        if (user.verifyCodeExpiresAt < now) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This code has expired. Request a new code below (same email) or sign up again.",
                    errorCode: "CODE_EXPIRED" as const,
                },
                { status: 400 },
            );
        }

        const a = Buffer.from(code, "utf8");
        const b = Buffer.from(user.verifyCode.toLowerCase(), "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return NextResponse.json(
                { success: false, message: "Invalid verification code." },
                { status: 400 },
            );
        }

        user.isVerified = true;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Email verified. You can sign in now.",
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, message: "Error verifying email" },
            { status: 500 },
        );
    }
}
