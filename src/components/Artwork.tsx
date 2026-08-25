import { AudioLines } from "lucide-react";

type ArtworkProps = {
  artwork?: string | null;
  color?: string;
  size?: "small" | "medium" | "large";
};

export function Artwork({
  artwork,
  color = "linear-gradient(135deg, #292929, #666)",
  size = "medium",
}: ArtworkProps) {
  return (
    <div
      className={`artwork artwork-${size}`}
      style={{
        background: artwork
          ? `url("${artwork}") center / cover`
          : color,
      }}
    >
      {!artwork && (
        <AudioLines
          size={
            size === "large"
              ? 36
              : 22
          }
          strokeWidth={1.4}
        />
      )}
    </div>
  );
}
