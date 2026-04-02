import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripHtml, isValidStatus, isValidPlatform, isValidCategory } from "@/lib/validation";

const CREATOR_EMAIL = "maciek@youmee.pl";
const OWNER_EMAIL = "admin@youmee.pl";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!session || (email !== CREATOR_EMAIL && email !== OWNER_EMAIL)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  // Owner can only change description, hashtags, and status (to "approved" only)
  if (email === OWNER_EMAIL) {
    if (body.description !== undefined) updateData.description = stripHtml(body.description);
    if (body.hashtags !== undefined) updateData.hashtags = stripHtml(body.hashtags);
    if (body.status !== undefined) {
      if (body.status !== "approved") {
        return NextResponse.json(
          { error: "Mozesz ustawic status tylko na 'approved'" },
          { status: 403 }
        );
      }
      updateData.status = body.status;
    }
  } else {
    // Creator can change everything
    if (body.title !== undefined) updateData.title = stripHtml(body.title);
    if (body.description !== undefined) updateData.description = stripHtml(body.description);
    if (body.hashtags !== undefined) updateData.hashtags = stripHtml(body.hashtags);
    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = body.status;
    }
    if (body.platform !== undefined) {
      if (!isValidPlatform(body.platform)) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }
      updateData.platform = body.platform;
    }
    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updateData.category = body.category;
    }
    if (body.date) updateData.date = new Date(body.date);

    // Handle new media (already uploaded to Supabase via signed URLs)
    if (body.media && Array.isArray(body.media) && body.media.length > 0) {
      await prisma.media.deleteMany({ where: { postId: id } });

      const mediaData = body.media.map((m: { url: string; type: string }, i: number) => ({
        url: m.url,
        type: m.type,
        order: i,
        postId: id,
      }));

      await prisma.media.createMany({ data: mediaData });
      updateData.imageUrl = mediaData[0].url;
    }
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
  if (!session || session.user?.email !== CREATOR_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
