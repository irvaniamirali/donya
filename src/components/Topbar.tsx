import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Page } from "../types/music";

type TopbarProps = {
  page: Page;
  search: string;
  onSearchChange: (value: string) => void;
};

export function Topbar({
  page,
  search,
  onSearchChange,
}: TopbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }

      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onSearchChange("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchChange]);

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Donya</span>
        <span className="breadcrumb-separator">/</span>
        <span className="muted">{page}</span>
      </div>

      <div className="topbar-actions">
        <div className="search">
          <Search size={16} />

          <input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your library"
          />

          {search && (
            <button
              className="search-clear"
              onClick={() => onSearchChange("")}
            >
              <X size={14} />
            </button>
          )}

          <kbd>⌘ K</kbd>
        </div>
      </div>
    </header>
  );
}