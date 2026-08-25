import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
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

        <button className="icon-button">
          <SlidersHorizontal size={17} />
        </button>
      </div>
    </header>
  );
}