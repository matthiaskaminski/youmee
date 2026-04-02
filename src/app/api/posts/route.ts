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

  const body = await req.json();
  const title = stripHtml(body.title || "");
  const description = stripHtml(body.description || "");
  const hashtags = stripHtml(body.hashtags || "");
  const status = body.status || "draft";
  const date = body.date as string;
  const platform = body.platform || "instagram";
  const category = body.category || "post";
  const uploadedMedia = (body.media || []) as { url: string; type: string }[];

  if (!isValidStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Media already uploaded directly to Supabase via signed URLs
  const mediaData = uploadedMedia.map((m, i) => ({
    url: m.url,
    type: m.type as "image" | "video",
    order: i,
  }));
  const thumbnailUrl = mediaData.length > 0 ? mediaData[0].url : "";

  const post = await prisma.post.create({
    data: {
      title,
      description,
      hashtags,
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
