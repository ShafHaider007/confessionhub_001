import { Message } from "../model/User";

export type ApiErrorCode =
    | "CODE_EXPIRED"
    | "ALREADY_VERIFIED"
    | "NOT_FOUND"
    | "RATE_LIMIT";

export interface ApiResponse {
    success: boolean;
    message: string;
    isAcceptingMessages?: boolean;
    messages?: Array<Message>;
    /** Machine-readable reason for some error responses */
    errorCode?: ApiErrorCode;
}