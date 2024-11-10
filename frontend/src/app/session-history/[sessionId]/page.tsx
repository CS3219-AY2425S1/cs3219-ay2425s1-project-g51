'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Adjust the import path based on your project structure
import SessionHistoryList from '@/components/session-history/SessionHistoryList';

export default function SessionHistoryPage({ params }: { params: any }) {
  const { sessionId } = params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col h-full overflow-hidden">
      <div>
        <Link href="/sessions">
          <Button variant="default" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            <span>Back to Sessions</span>
          </Button>
        </Link>
      </div>
      <div className='flex-grow h-full flex overflow-hidden'>
        <SessionHistoryList sessionId={sessionId} />
      </div>
    </main>
  );
}
