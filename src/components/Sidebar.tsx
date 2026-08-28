import {
  Album,
  Heart,
  Home,
  ListMusic,
  Settings,
  UserRound,
} from "lucide-react";

import type { Page } from "../types/music";

type SidebarProps = {
  page: Page;
  onPageChange: (page: Page) => void;
};

const navItems: {
  label: Page;
  icon: typeof Home;
}[] = [
  { label: "Home", icon: Home },
  { label: "Songs", icon: ListMusic },
  { label: "Albums", icon: Album },
  { label: "Artists", icon: UserRound },
];

const collections: {
  label: Page;
  icon: typeof Heart;
}[] = [{ label: "Favorites", icon: Heart }];

export function Sidebar({
  page,
  onPageChange,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">
            <ListMusic size={19} strokeWidth={1.8} />
          </div>

          <span>donya</span>
        </div>

        <nav className="sidebar-section">
          <div className="section-label">LIBRARY</div>

          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                page === label ? "active" : ""
              }`}
              onClick={() => onPageChange(label)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <nav className="sidebar-section">
          <div className="section-label">COLLECTIONS</div>

          {collections.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                page === label ? "active" : ""
              }`}
              onClick={() => onPageChange(label)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${
            page === "Settings" ? "active" : ""
          }`}
          onClick={() => onPageChange("Settings")}
        >
          <Settings size={17} strokeWidth={1.8} />
          <span>Settings</span>
        </button>

        <div className="user-card">
          <div className="user-avatar">A</div>

          <div className="user-info">
            <span>Amiri</span>
            <small>Local library</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
