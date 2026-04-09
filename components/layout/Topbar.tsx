'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAppStore } from '@/lib/app-store';
import { createClient } from '@/lib/supabase/client';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

export function Topbar() {
  const { taskStreak } = useAppStore();
  const today = new Date();
  const [initials, setInitials] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setInitials(getInitials(
        data.user?.user_metadata?.full_name,
        data.user?.email,
      ));
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 pt-safe">
      <div className="bg-bg/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-border/50 dark:border-border-dark/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-screen-lg mx-auto">

          {/* Date */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark uppercase tracking-widest">
              {format(today, 'EEEE')}
            </p>
            <p className="text-[15px] font-semibold text-text dark:text-text-dark leading-tight font-display">
              {format(today, 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Right: streak badge + profile avatar */}
          <div className="flex items-center gap-2">

            {/* Streak badge */}
            <motion.div
              className="flex items-center gap-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-full px-3 py-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-sm leading-none"
              >
                🔥
              </motion.span>
              <span className="text-[13px] font-bold text-text dark:text-text-dark">
                {taskStreak.current}
              </span>
              <span className="text-[11px] text-muted dark:text-muted-dark font-medium">streak</span>
            </motion.div>

            {/* Profile avatar → /profile */}
            <Link href="/profile" aria-label="Open profile">
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-sm select-none"
                style={{ background: 'linear-gradient(135deg, #7C6EF8 0%, #3EC99A 100%)' }}
              >
                {initials}
              </motion.div>
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}
