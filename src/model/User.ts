import mongoose, {Schema, Document} from "mongoose";


export interface Message extends Document {
    content: string;
    createdAt: Date;

}


const messageSchema: Schema<Message> = new Schema({
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});


export interface User extends Document {
    username: string;
    password: string;
    email: string;
    verifyCode: string;
    verifyCodeExpiresAt: Date;
    isVerified: boolean;
    /** Rate-limit: last time a verification email was sent. */
    lastVerificationEmailAt?: Date | null;
    /** Start of rolling 24h window for email send count. */
    verificationEmailWindowStart?: Date | null;
    /** Sends in the current 24h window (max 5). */
    verificationEmailWindowCount?: number;
    isAcceptingMessages: boolean;
    messages: Message[];


}

const userSchema: Schema<User> = new Schema({
   
    username: { type: String, required: [true, "Username is required"], unique: true , trim: true},
    password: { type: String, required: [true, "Password is required"], minlength: [8, "Password must be at least 8 characters long"]},
    email: { type: String, required: true, unique: true , match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]},
    verifyCodeExpiresAt: { type: Date, required: [true, "Verify code expiry at is required"] },
    verifyCode: { type: String, required: [true, "Verify code is required"] },
    isVerified: { type: Boolean, default: false },
    lastVerificationEmailAt: { type: Date, default: null },
    verificationEmailWindowStart: { type: Date, default: null },
    verificationEmailWindowCount: { type: Number, default: 0 },
    isAcceptingMessages: { type: Boolean, default: true },
    messages: { type: [messageSchema], default: [] },

});

const UserModel =  (mongoose.models.User as mongoose.Model<User> || mongoose.model<User>("User", userSchema)); //if the user model is already defined, use it, otherwise create a new one
export default UserModel;