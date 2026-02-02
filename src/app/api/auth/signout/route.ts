import { signOut } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // signOut returns a redirect response
    return signOut();
  } catch (error) {
    console.error('Signout error:', error);
    // Fallback: redirect to home and clear cookies manually
    const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://wave.getceda.com'));
    response.cookies.delete('wos-session');
    return response;
  }
}
