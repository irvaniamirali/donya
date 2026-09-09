import { useEffect, useMemo, useState } from "react";

import {
  Check,
  ImagePlus,
  Music4,
  X,
} from "lucide-react";

import { DEFAULT_PLAYLIST_COVER } from "../hooks/usePlaylists";
import type { Playlist } from "../types/music";

type PlaylistDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialPlaylist?: Playlist | null;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    caption: string;
    cover: string | null;
  }) => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read image file."));
    };

    reader.onerror = () => reject(reader.error ?? new Error("Image read failed."));
    reader.readAsDataURL(file);
  });

export function PlaylistDialog({
  open,
  mode,
  initialPlaylist,
  onClose,
  onSubmit,
}: PlaylistDialogProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(initialPlaylist?.title ?? "");
    setCaption(initialPlaylist?.caption ?? "");
    setCover(initialPlaylist?.cover ?? DEFAULT_PLAYLIST_COVER);
    setError(null);
  }, [open, initialPlaylist]);

  const previewCover = useMemo(
    () => cover || DEFAULT_PLAYLIST_COVER,
    [cover],
  );

  if (!open) return null;

  const handleCoverSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCover(dataUrl);
    } catch (readError) {
      console.error("[Donya] Failed to read playlist cover:", readError);
      setError("The selected image could not be read.");
    }

    event.target.value = "";
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Playlist name is required.");
      return;
    }

    onSubmit({
      title: trimmedTitle,
      caption: caption.trim(),
      cover,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="playlist-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="playlist-dialog-header">
          <div>
            <span className="eyebrow">PLAYLISTS</span>
            <h2>{mode === "create" ? "Create playlist" : "Edit playlist"}</h2>
          </div>

          <button className="icon-button subtle" onClick={onClose} aria-label="Close dialog">
            <X size={15} />
          </button>
        </div>

        <div className="playlist-dialog-body">
          <div className="playlist-cover-picker">
            <div
              className="playlist-cover-preview"
              style={{
                backgroundImage: `url("${previewCover}")`,
              }}
            >
              {!cover && (
                <Music4 size={28} strokeWidth={1.5} />
              )}
            </div>

            <div className="playlist-cover-actions">
              <label className="secondary-button">
                <ImagePlus size={14} />
                {cover ? "Change cover" : "Choose cover"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                />
              </label>

              {cover && (
                <button
                  className="text-button"
                  onClick={() => setCover(null)}
                >
                  Remove cover
                </button>
              )}
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Summer drives"
                maxLength={80}
              />
            </label>

            <label className="field">
              <span>Caption</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="A chilled-out set for long evenings."
                rows={4}
                maxLength={220}
              />
            </label>
          </div>

          {error && <div className="dialog-error">{error}</div>}
        </div>

        <div className="playlist-dialog-footer">
          <button className="text-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button compact" onClick={handleSubmit}>
            <Check size={14} />
            {mode === "create" ? "Create playlist" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
