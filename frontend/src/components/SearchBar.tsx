import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onSearch, placeholder = "Search by name, phone, or email…" }: SearchBarProps) {
  const [input, setInput] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setInput(value);
  }

  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    if (debouncedInput !== value) {
      onSearch(debouncedInput);
    }
  }, [debouncedInput, value, onSearch]);

  return (
    <div className="relative w-full max-w-md">
      <svg
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-400"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-blue-200 py-2 pr-3 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
      />
    </div>
  );
}
