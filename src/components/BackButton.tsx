import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label: string;
  onClick: () => void;
};

export function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button className="back-button" onClick={onClick}>
      <span className="back-button-icon">
        <ArrowLeft size={14} strokeWidth={2.4} />
      </span>
      <span>{label}</span>
    </button>
  );
}
