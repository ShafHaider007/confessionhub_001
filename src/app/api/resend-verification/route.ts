import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import dbconnect from "@/lib/dbConnect";
import { sendVerificationEmail } from "@/lib/helpers/sendVerificationEmail";
import {
    VERIFICATION_CODE_TTL_MS,
    VERIFICATION_CODE_TTL_MINUTES,
} from "@/lib/auth/verificationConstants";
import {
    assertCanSendVerificationEmail,
    nextVerificationEmailTracking,
} from "@/lib/auth/verificationEmailPolicy";
import UserModel from "@/model/User";
import { resendVerificationSchema } from "@/schemas/resendVerificationSchema";

const GENERIC_OK =
    "If an unverified account exists for this email, we sent a new verification code.";

export async function POST(request: Request) {
    await dbconnect();
    try {
        const body = await request.json();
        const parsed = resendVerificationSchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return NextResponse.json(
                { success: false, message: first?.message ?? "Invalid input" },
                { status: 400 },
            );
        }

        const { email } = parsed.data;
        const user = await UserModel.findOne({ email });

        if (!user || user.isVerified) {
            return NextResponse.json(
                { success: true, message: GENERIC_OK },
                { status: 200 },
            );
        }

        const gate = assertCanSendVerificationEmail(user);
        if (!gate.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: gate.message,
                    errorCode: "RATE_LIMIT" as const,
                },
                { status: gate.status },
            );
        }

        const verifyCode = randomBytes(32).toString("hex");
        const verifyCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
        const track = nextVerificationEmailTracking(user);

        user.verifyCode = verifyCode;
        user.verifyCodeExpiresAt = verifyCodeExpiresAt;
        user.lastVerificationEmailAt = track.lastVerificationEmailAt;
        user.verificationEmailWindowStart = track.verificationEmailWindowStart;
        user.verificationEmailWindowCount = track.verificationEmailWindowCount;
        await user.save();

        const emailResult = await sendVerificationEmail(
            email,
            user.username,
            verifyCode,
        );
        if (!emailResult.success) {
            return NextResponse.json(
                { success: false, message: emailResult.message },
                { status: 502 },
            );
        }

        return NextResponse.json({
            success: true,
            message: `A new verification code was sent. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, message: "Error sending verification email" },
            { status: 500 },
        );
    }
}
