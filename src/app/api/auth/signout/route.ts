import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wave.getceda.com';

  // Manual signout: clear WorkOS session cookie and redirect
  const response = NextResponse.redirect(new URL('/', baseUrl));

  // Delete the WorkOS session cookie
  response.cookies.set('wos-session', '', {
    expires: new Date(0),
    path: '/',
  });

  return response;
}
