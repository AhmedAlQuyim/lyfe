'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, CheckSquare, Dumbbell, Calendar, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home,        label: 'Home'     },
  { href: '/goals',     icon: Target,      label: 'Goals'    },
  { href: '/tasks',     icon: CheckSquare, label: 'Tasks'    },
  { href: '/workouts',  icon: Dumbbell,    label: 'Workouts' },
  { href: '/ideas',     icon: Lightbulb,   label: 'Ideas'    },
  { href: '/schedule',  icon: Calendar,    label: 'Schedule' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-t border-border dark:border-border-dark" />
      <div className="relative flex items-center justify-around px-1 pt-1.5" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-1 px-1 rounded-2xl transition-all duration-200',
                active ? 'text-accent dark:text-violet' : 'text-muted dark:text-muted-dark'
              )}>
              <div className={cn('p-1 rounded-xl transition-all duration-200', active && 'bg-accent/10 dark:bg-violet/15')}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className="transition-all duration-200" />
              </div>
              <span className={cn('text-[9px] font-medium tracking-wide transition-all', active ? 'opacity-100' : 'opacity-60')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
