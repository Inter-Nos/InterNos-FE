'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
}

export default function Layout({ children, headerTitle = 'Inter Nos' }: LayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-mobile mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">{headerTitle}</h1>
        </div>
      </header>

      {/* Main Content - 480px max width container */}
      <main className="flex-1 max-w-mobile mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 safe-area-bottom">
        <div className="max-w-mobile mx-auto flex">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 min-h-[44px] ${
              isActive('/dashboard')
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">대시보드</span>
          </Link>

          <Link
            href="/rooms"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 min-h-[44px] ${
              isActive('/rooms')
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-xs">공개 방</span>
          </Link>

          <Link
            href="/create"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 min-h-[44px] ${
              isActive('/create')
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs">방 만들기</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

