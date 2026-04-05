import { resend } from "../resend";

import { VerificationEmail } from "../../../emails/verificationEmail";

import { ApiResponse } from "../../types/ApiResponse";



export async function sendVerificationEmail(
     email: string,
     username: string,
     verifyCode: string,
): Promise<ApiResponse>{
    try{

        await resend.emails.send({
            from: 'Acme <shafhaider001@gmail.com>',
            to: email,
            subject: 'Verification Code for ConfessionHub',
            html: `<p>Hello ${username},</p>
            <p>Your verification code is: ${verifyCode}</p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Thank you for using our service.</p>
            <p>Best regards, Shaf Haider</p>`,
            react: VerificationEmail({ code: verifyCode , username: username }),
          });
        return {
            success: true,
            message: "Verification email sent successfully",
        }; 
    }
    catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Error sending verification email",
        };
    }
}