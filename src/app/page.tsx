import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@workos-inc/authkit-nextjs';

export default async function Home() {
  const { user } = await getUser();

  // If user is already logged in, redirect to chat
  if (user) {
    redirect('/chat');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Wave
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          CEDA Collaborative Workspace
        </p>
        <p className="text-gray-500 mb-12">
          Where teams and AI work together. Enterprise-grade collaboration with pattern memory.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/api/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 text-gray-600 text-sm">
        Powered by CEDA Pattern Memory
      </footer>
    </main>
  );
}
