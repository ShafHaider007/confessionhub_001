import { VerificationEmail } from "../../../emails/verificationEmail";
import { ApiResponse } from "../../types/ApiResponse";
import { resend } from "../resend";

/**
 * Env:
 * - RESEND_API_KEY (required)
 * - RESEND_FROM (optional) — e.g. `SpatialX <onboarding@resend.dev>` or `Name <noreply@your-verified-domain.com>`
 *
 * Without a verified domain, use Resend’s test sender: onboarding@resend.dev (see RESEND_FROM default below).
 */
export async function sendVerificationEmail(
    email: string,
    username: string,
    verifyCode: string,
): Promise<ApiResponse> {
    if (!process.env.RESEND_API_KEY?.trim()) {
        console.error("[sendVerificationEmail] Missing RESEND_API_KEY");
        return {
            success: false,
            message: "Email is not configured. Add RESEND_API_KEY to your environment.",
        };
    }

    const from =
        process.env.RESEND_FROM?.trim() ||
        "SpatialX <onboarding@resend.dev>";

    try {
        const { data, error } = await resend.emails.send({
            from,
            to: email,
            subject: "Verification code — SpatialX",
            react: VerificationEmail({ code: verifyCode, username }),
        });

        if (error) {
            console.error("[sendVerificationEmail] Resend API error:", error);
            return {
                success: false,
                message:
                    error.message ||
                    "Could not send verification email. Check RESEND_FROM and your Resend dashboard.",
            };
        }

        if (!data) {
            return {
                success: false,
                message: "Could not send verification email.",
            };
        }

        return {
            success: true,
            message: "Verification email sent successfully",
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Error sending verification email",
        };
    }
}
