"use client";

const statusLabels: Record<string, string> = {
  draft: "Szkic",
  review: "Do akceptacji",
  approved: "Zaakceptowany",
  published: "Opublikowany",
};

const statusColors: Record<string, string> = {
  draft: "bg-ym-pink text-ym-pink-3",
  review: "bg-ym-pink text-ym-pink-2",
  approved: "bg-ym-green text-ym-green-2",
  published: "bg-ym-blue text-ym-blue-2",
};

export default function StatusBadge({
  status,
  onClick,
}: {
  status: string;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
