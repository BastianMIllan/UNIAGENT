"use client";

interface Props {
  status: "online" | "syncing" | "offline";
  label?: string;
}

const colors = {
  online: "bg-(--green)",
  syncing: "bg-(--yellow)",
  offline: "bg-(--red)",
};

export default function StatusDot({ status, label }: Props) {
  return (
    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-(--text-secondary)">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors[status]} opacity-75`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${colors[status]}`}
        />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}
