import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuid } from "uuid";

async function uploadFile(file: File): Promise<{ url: string; type: "image" | "video" }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${uuid()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("media")
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("media")
    .getPublicUrl(filename);

  const videoExts = ["mp4", "mov", "webm", "avi"];
  const type = videoExts.includes(ext) ? "video" : "image";

  return { url: urlData.publicUrl, type };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const hashtags = formData.get("hashtags") as string;
  const status = formData.get("status") as string;
  const date = formData.get("date") as string;
  const platform = formData.get("platform") as string;

  const updateData: Record<string, unknown> = {};
  if (title !== null) updateData.title = title;
  if (description !== null) updateData.description = description;
  if (hashtags !== null) updateData.hashtags = hashtags;
  if (status !== null) updateData.status = status;
  if (platform !== null) updateData.platform = platform;
  if (date) updateData.date = new Date(date);

  // Handle new files
  const files = formData.getAll("files") as File[];
  const newFiles = files.filter((f) => f && f.size > 0);

  if (newFiles.length > 0) {
    // Delete old media
    await prisma.media.deleteMany({ where: { postId: id } });

    const mediaData = [];
    for (let i = 0; i < newFiles.length; i++) {
      const saved = await uploadFile(newFiles[i]);
      mediaData.push({ ...saved, order: i, postId: id });
    }

    await prisma.media.createMany({ data: mediaData });
    updateData.imageUrl = mediaData[0].url;
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: {
      media: { orderBy: { order: "asc" } },
      comments: {
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
