import { useState } from "react";

import {
  FolderOpen,
  FolderX,
  Heart,
  Library,
  Loader2,
  Music2,
  RefreshCw,
  Trash2,
} from "lucide-react";

import type { MusicSource } from "../hooks/useMusicLibrary";

type SettingsProps = {
  sources: MusicSource[];

  loading: boolean;
  scanningPath: string | null;
  error: string | null;

  onAddSource: () => void;
  onRemoveSource: (path: string) => void;
  onRescanSource: (path: string) => void;
  onRescanAll: () => void;

  trackCount: number;
  albumCount: number;
  artistCount: number;

  favoriteCount: number;
  onClearFavorites: () => void;
};

export function Settings({
  sources,
  loading,
  scanningPath,
  error,
  onAddSource,
  onRemoveSource,
  onRescanSource,
  onRescanAll,
  trackCount,
  albumCount,
  artistCount,
  favoriteCount,
  onClearFavorites,
}: SettingsProps) {
  const [confirmClearFavorites, setConfirmClearFavorites] =
    useState(false);

  return (
    <section className="page-section settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your music sources and local library.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="stat-card">
          <span className="stat-value">{trackCount}</span>
          <span className="stat-label">Tracks</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{albumCount}</span>
          <span className="stat-label">Albums</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{artistCount}</span>
          <span className="stat-label">Artists</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{favoriteCount}</span>
          <span className="stat-label">Favorites</span>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2>Music Sources</h2>
            <p>Folders Donya scans for music on this device.</p>
          </div>

          <div className="settings-section-actions">
            {sources.length > 0 && (
              <button
                className="filter-button"
                onClick={onRescanAll}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Rescan all
              </button>
            )}

            <button
              className="primary-button compact"
              onClick={onAddSource}
              disabled={loading}
            >
              <FolderOpen size={15} />
              Add folder
            </button>
          </div>
        </div>

        {error && <div className="library-error">{error}</div>}

        {sources.length === 0 ? (
          <div className="settings-empty">
            <Music2 size={22} strokeWidth={1.5} />
            <strong>No music sources yet</strong>
            <span>Add a folder to start building your library.</span>
          </div>
        ) : (
          <div className="source-list">
            {sources.map((source) => {
              const isScanning = scanningPath === source.path;

              return (
                <div className="source-row" key={source.path}>
                  <div className="source-icon">
                    <FolderOpen size={17} strokeWidth={1.7} />
                  </div>

                  <div className="source-info">
                    <strong title={source.path}>
                      {folderName(source.path)}
                    </strong>
                    <span title={source.path}>{source.path}</span>
                  </div>

                  <div className="source-meta">
                    {isScanning ? (
                      <span className="source-scanning">
                        <Loader2 size={12} className="spin" />
                        Scanning…
                      </span>
                    ) : (
                      <span className="source-count">
                        {source.trackCount}{" "}
                        {source.trackCount === 1 ? "track" : "tracks"}
                      </span>
                    )}
                  </div>

                  <div className="source-actions">
                    <button
                      className="icon-button subtle"
                      onClick={() => onRescanSource(source.path)}
                      disabled={isScanning}
                      aria-label="Rescan folder"
                      title="Rescan folder"
                    >
                      <RefreshCw size={15} />
                    </button>

                    <button
                      className="icon-button subtle danger"
                      onClick={() => onRemoveSource(source.path)}
                      aria-label="Remove folder"
                      title="Remove folder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2>Favorites</h2>
            <p>Clear your liked tracks from this device.</p>
          </div>
        </div>

        <div className="settings-card-row">
          <div className="settings-card-row-icon">
            <Heart size={17} strokeWidth={1.7} />
          </div>

          <div className="source-info">
            <strong>{favoriteCount} liked tracks</strong>
            <span>Stored locally, not synced anywhere</span>
          </div>

          {confirmClearFavorites ? (
            <div className="settings-confirm">
              <span>Remove all?</span>

              <button
                className="text-button"
                onClick={() => setConfirmClearFavorites(false)}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={() => {
                  onClearFavorites();
                  setConfirmClearFavorites(false);
                }}
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              className="danger-button"
              onClick={() => setConfirmClearFavorites(true)}
              disabled={favoriteCount === 0}
            >
              <FolderX size={14} />
              Clear favorites
            </button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2>About</h2>
            <p>Donya is a local-first music player.</p>
          </div>
        </div>

        <div className="settings-card-row">
          <div className="settings-card-row-icon">
            <Library size={17} strokeWidth={1.7} />
          </div>

          <div className="source-info">
            <strong>Donya Music</strong>
            <span>Version 0.1.0 · Local library only</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function folderName(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalized.split("/");

  return parts[parts.length - 1] || path;
}
