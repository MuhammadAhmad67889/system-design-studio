'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

/* Search input: submitting takes the learner to /search?q=... */
export function SearchBox({
  defaultValue = '',
  placeholder = 'Search lessons, cheatsheets, case studies…',
  className = '',
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={`w-full ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Search
      </label>
      <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-line bg-surface px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>
    </form>
  );
}
