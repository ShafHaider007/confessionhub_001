import { withAuth } from "next-auth/middleware";

function isPublicPath(pathname: string) {
    if (pathname === "/") return true;
    if (pathname.startsWith("/sign-in")) return true;
    if (pathname.startsWith("/sign-up")) return true;
    if (pathname.startsWith("/verify-email")) return true;
    return false;
}

export default withAuth({
    //  if authorized then?
    pages: {
        signIn: "/sign-in",
    },
    callbacks: {
        // Token is decoded from the cookie here (no MongoDB). Claims match JWT after last
        // session refresh; use getServerUser() in API routes when you need live DB truth.
        authorized: ({ req, token }) => {
            if (isPublicPath(req.nextUrl.pathname)) return true;
            if (!token || token.invalid) return false;
            if (token.isVerified === false) return false;
            return true;
        },
    },
});

export const config = {
    // Every entry must start with "/" (Next.js 16 validates `config.matcher`).
    matcher: [
        "/",
        "/sign-in",
        "/sign-up",
        "/verify-email",
        "/verify-email/:path*",
        "/dashboard",
        "/dashboard/:path*",
    ],
};
