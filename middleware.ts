import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// WorkOS AuthKit middleware for protected routes
export default authkitMiddleware({
  // Routes that don't require authentication
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/api/health', '/api/auth/signin', '/api/auth/callback'],
  },
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
