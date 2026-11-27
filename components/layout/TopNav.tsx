'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SearchBox } from '@/components/ui/SearchBox';
import { MobileDrawer } from '@/components/layout/MobileDrawer';

const NAV_LINKS = [
  { href: '/learn', label: 'Learn' },
  { href: '/practice', label: 'Practice' },
  { href: '/design-lab', label: 'Design Lab' },
  { href: '/cheatsheets', label: 'Cheatsheets' },
];

export function TopNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b-[1.5px] border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-line bg-surface text-ink md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link href="/" className="flex min-w-0 shrink-0 items-baseline gap-2">
            <span className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
              SYSTEM DESIGN
            </span>
            <span className="rounded-md bg-leaf px-1.5 py-0.5 font-display text-xs font-bold text-ink">
              Studio
            </span>
          </Link>

          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 font-display text-sm font-bold transition-colors ${
                    active ? 'bg-leaf text-ink' : 'text-muted hover:bg-surface hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden w-full max-w-xs lg:block">
            <SearchBox />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-line bg-surface text-ink lg:ml-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
