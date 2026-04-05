import dbconnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { VERIFICATION_CODE_TTL_MS } from "@/lib/auth/verificationConstants";
import {
    assertCanSendVerificationEmail,
    nextVerificationEmailTracking,
} from "@/lib/auth/verificationEmailPolicy";
import { sendVerificationEmail } from "@/lib/helpers/sendVerificationEmail";
import { signUpSchema } from "@/schemas/signUpSchema";


export async function POST(request: Request){
    await dbconnect();
    try {
        const body = await request.json();
        const parsed = signUpSchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return NextResponse.json(
                { success: false, message: first?.message ?? "Invalid input" },
                { status: 400 },
            );
        }
        const { username, password, email } = parsed.data;

        const hashedPassword = await bcrypt.hash(password, 10);
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
        const verifyCode = randomBytes(32).toString("hex");

        const existingUserByEmail = await UserModel.findOne({ email });

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return NextResponse.json(
                    { success: false, message: "An account with this email already exists" },
                    { status: 400 },
                );
            }

            const gate = assertCanSendVerificationEmail(existingUserByEmail);
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

            const track = nextVerificationEmailTracking(existingUserByEmail);

            existingUserByEmail.username = username;
            existingUserByEmail.password = hashedPassword;
            existingUserByEmail.verifyCode = verifyCode;
            existingUserByEmail.verifyCodeExpiresAt = expiresAt;
            existingUserByEmail.lastVerificationEmailAt =
                track.lastVerificationEmailAt;
            existingUserByEmail.verificationEmailWindowStart =
                track.verificationEmailWindowStart;
            existingUserByEmail.verificationEmailWindowCount =
                track.verificationEmailWindowCount;
            await existingUserByEmail.save();

            const emailResult = await sendVerificationEmail(
                email,
                username,
                verifyCode,
            );
            if (!emailResult.success) {
                return NextResponse.json(
                    { success: false, message: emailResult.message },
                    { status: 502 },
                );
            }
            return NextResponse.json(
                { success: true, message: "Verification details updated; check your email" },
                { status: 200 },
            );
        }

        const trackNew = nextVerificationEmailTracking({});

        const newUser = new UserModel({
            username,
            password: hashedPassword,
            email,
            verifyCode,
            verifyCodeExpiresAt: expiresAt,
            lastVerificationEmailAt: trackNew.lastVerificationEmailAt,
            verificationEmailWindowStart: trackNew.verificationEmailWindowStart,
            verificationEmailWindowCount: trackNew.verificationEmailWindowCount,
        });
        await newUser.save();

        const emailResult = await sendVerificationEmail(
            email,
            username,
            verifyCode,
        );
        if (!emailResult.success) {
            return NextResponse.json(
                { success: false, message: emailResult.message },
                { status: 502 },
            );
        }
        return NextResponse.json(
            { success: true, message: "User created successfully" },
            { status: 201 },
        );
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Error signing up" }, { status: 500 });
    }
}
