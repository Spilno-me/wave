import { handleAuth } from '@workos-inc/authkit-nextjs';

export const GET = handleAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
