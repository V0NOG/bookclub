export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/home/:path*",
    "/discover/:path*",
    "/clubs/:path*",
    "/library/:path*",
    "/tracker/:path*",
    "/challenges/:path*",
    "/feed/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
