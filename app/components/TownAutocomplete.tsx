"use client";

import { useState, useRef, useEffect } from "react";
import { UK_TOWNS } from "@/lib/uk-towns";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function TownAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches =
    query.trim().length === 0
      ? []
      : UK_TOWNS.filter((t) =>
          t.toLowerCase().startsWith(query.trim().toLowerCase())
        ).slice(0, 6);

  const isValidSelection = (UK_TOWNS as readonly string[]).includes(
    query.trim()
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(town: string) {
    setQuery(town);
    onChange(town);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(""); // clear the confirmed value until a real match is picked
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing your town or city"
        className="w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-[16px] focus:outline-none focus:border-coral"
      />
      {!isValidSelection && query.trim().length > 0 && (
        <p className="mt-1.5 text-xs text-sub">
          Pick a town from the list so we can match you with others nearby.
        </p>
      )}
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border-2 border-line rounded-2xl overflow-hidden shadow-lg">
          {matches.map((town) => (
            <button
              type="button"
              key={town}
              onClick={() => select(town)}
              className="w-full text-left px-4 py-3 text-[15px] hover:bg-coral-soft"
            >
              {town}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
