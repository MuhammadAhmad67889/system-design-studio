import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t-[1.5px] border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-display text-sm font-bold">
          SYSTEM DESIGN <span className="rounded bg-leaf px-1 py-0.5 text-xs">Studio</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/learn" className="text-sm text-muted hover:text-ink">
            Learn
          </Link>
          <Link href="/practice" className="text-sm text-muted hover:text-ink">
            Practice
          </Link>
          <Link href="/design-lab" className="text-sm text-muted hover:text-ink">
            Design Lab
          </Link>
          <Link href="/cheatsheets" className="text-sm text-muted hover:text-ink">
            Cheatsheets
          </Link>
        </nav>
        <p className="text-sm text-muted">
          Learn how systems scale — one lesson at a time.
        </p>
      </div>
    </footer>
  );
}
