"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PreviewItem {
  id: string;
  url: string;
  type: string;
  fileIndex: number;
}

function SortablePreview({ item }: { item: PreviewItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab active:cursor-grabbing relative group"
    >
      {item.type === "video" ? (
        <div className="w-24 h-24 bg-ym-text/10 rounded-lg flex items-center justify-center">
          <span className="text-2xl">▶</span>
          <span className="text-xs text-ym-text-2 ml-1">Video</span>
        </div>
      ) : (
        <img
          src={item.url}
          alt=""
          className="w-24 h-24 object-cover rounded-lg"
        />
      )}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-ym-blue-2 transition pointer-events-none" />
      <span className="absolute -top-1 -left-1 bg-ym-text text-beige text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition">
        ⠿
      </span>
    </div>
  );
}

export default function CreatePostForm({
  onCreated,
  defaultDate,
  defaultOpen,
  onClose,
}: {
  onCreated: () => void;
  defaultDate?: string;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [platform, setPlatform] = useState("instagram");
  const [status, setStatus] = useState("draft");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (defaultOpen) setOpen(true);
    if (defaultDate) setDate(defaultDate);
  }, [defaultOpen, defaultDate]);

  const handleFilesChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const arr = Array.from(selectedFiles);
    setFiles(arr);

    const newPreviews: PreviewItem[] = arr.map((file, i) => {
      const isVideo = file.type.startsWith("video/");
      const url = URL.createObjectURL(file);
      return { id: `preview-${i}`, url, type: isVideo ? "video" : "image", fileIndex: i };
    });
    setPreviews(newPreviews);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = previews.findIndex((p) => p.id === active.id);
    const newIndex = previews.findIndex((p) => p.id === over.id);

    const newPreviews = arrayMove(previews, oldIndex, newIndex);
    setPreviews(newPreviews);

    // Reorder files array to match
    const newFiles = newPreviews.map((p) => files[p.fileIndex]);
    setFiles(newFiles);
    // Update fileIndex references
    setPreviews(newPreviews.map((p, i) => ({ ...p, fileIndex: i })));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("hashtags", hashtags);
    formData.append("date", date);
    formData.append("platform", platform);
    formData.append("status", status);
    // Files are already in the reordered order
    for (const file of files) {
      formData.append("files", file);
    }

    await fetch("/api/posts", { method: "POST", body: formData });

    // Reset
    setTitle("");
    setDescription("");
    setHashtags("");
    setDate("");
    setPlatform("instagram");
    setStatus("draft");
    setFiles([]);
    setPreviews([]);
    setSaving(false);
    setOpen(false);
    onCreated();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-beige-2 rounded-xl text-sm text-ym-text-2 hover:border-ym-blue-2 hover:text-ym-text transition"
      >
        + Dodaj nowy post
      </button>
    );
  }

  return (
    <div className="bg-beige-2 rounded-2xl border border-beige-2 p-6">
      <h3 className="font-semibold mb-4">Nowy post</h3>
      <div className="space-y-3">
        {/* File upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-ym-blue rounded-xl p-6 text-center cursor-pointer hover:border-ym-blue-2 transition"
        >
          {previews.length > 0 ? (
            <div onClick={(e) => e.stopPropagation()}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={previews.map((p) => p.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {previews.map((p) => (
                      <SortablePreview key={p.id} item={p} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <p className="text-[10px] text-ym-text-3 mt-2">
                Przeciągnij aby zmienić kolejność • Kliknij poza zdjęciami aby dodać więcej
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ym-text-2">
                Kliknij aby dodać zdjęcia lub video
              </p>
              <p className="text-xs text-ym-text-2 mt-1">
                PNG, JPG, WebP, MP4 - możesz wybrać wiele plików (karuzela)
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesChange(e.target.files)}
          />
        </div>

        {previews.length > 1 && (
          <p className="text-xs text-ym-green-2">
            Karuzela: {previews.length} slajdów
          </p>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tytuł posta"
          className="w-full bg-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opis / treść posta..."
          rows={3}
          className="w-full bg-beige rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ym-blue-2"
        />
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#youmee #kubeczki #dzieci"
          className="w-full bg-beige rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue-2"
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-ym-text-2 mb-1 block">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-beige rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-ym-text-2 mb-1 block">
              Platforma
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-beige rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="both">Obie</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-ym-text-2 mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-beige rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="draft">Szkic</option>
              <option value="review">Do akceptacji</option>
              <option value="approved">Zaakceptowany</option>
              <option value="published">Opublikowany</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="px-6 py-2.5 bg-ym-text text-beige rounded-xl text-sm font-medium hover:bg-ym-text-2 disabled:opacity-50 transition"
          >
            {saving ? "Dodawanie..." : "Dodaj post"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setFiles([]);
              setPreviews([]);
              onClose?.();
            }}
            className="px-6 py-2.5 bg-beige rounded-xl text-sm hover:bg-ym-blue/30 transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
