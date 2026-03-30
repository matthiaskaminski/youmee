import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuid } from "uuid";
import { stripHtml, isValidStatus, isValidPlatform, isValidCategory } from "@/lib/validation";

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

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: [{ date: "asc" }, { order: "asc" }],
    include: {
      media: { orderBy: { order: "asc" } },
      comments: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.email !== "maciek@youmee.pl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = stripHtml(formData.get("title") as string);
  const description = stripHtml(formData.get("description") as string);
  const hashtags = stripHtml(formData.get("hashtags") as string);
  const status = (formData.get("status") as string) || "draft";
  const date = formData.get("date") as string;
  const platform = (formData.get("platform") as string) || "instagram";
  const category = (formData.get("category") as string) || "post";

  if (!isValidStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Handle multiple files
  const files = formData.getAll("files") as File[];
  const mediaData: { url: string; type: "image" | "video"; order: number }[] = [];
  let thumbnailUrl = "";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && file.size > 0) {
      const saved = await uploadFile(file);
      mediaData.push({ ...saved, order: i });
      if (i === 0) thumbnailUrl = saved.url;
    }
  }

  // Fallback: single image field
  if (mediaData.length === 0) {
    const singleImage = formData.get("image") as File | null;
    if (singleImage && singleImage.size > 0) {
      const saved = await uploadFile(singleImage);
      mediaData.push({ ...saved, order: 0 });
      thumbnailUrl = saved.url;
    }
  }

  const post = await prisma.post.create({
    data: {
      title,
      description: description || "",
      hashtags: hashtags || "",
      imageUrl: thumbnailUrl,
      status,
      date: date ? new Date(date) : null,
      platform,
      category,
      media: {
        create: mediaData,
      },
    },
    include: {
      media: { orderBy: { order: "asc" } },
      comments: true,
    },
  });

  return NextResponse.json(post);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Batch update for reordering
  if (Array.isArray(body)) {
    for (const item of body) {
      await prisma.post.update({
        where: { id: item.id },
        data: {
          order: item.order,
          date: item.date ? new Date(item.date) : undefined,
        },
      });
    }
    return NextResponse.json({ success: true });
  }

  const { id, ...data } = body;
  if (data.date) data.date = new Date(data.date);

  const post = await prisma.post.update({
    where: { id },
    data,
  });

  return NextResponse.json(post);
}
