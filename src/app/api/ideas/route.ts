import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripHtml } from "@/lib/validation";

export async function GET() {
  const ideas = await prisma.idea.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const title = stripHtml(body.title || "").trim();
  const description = stripHtml(body.description || "").trim();
  const category = body.category || "post";
  const status = body.status || "new";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const validCategories = ["post", "story", "reels"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const idea = await prisma.idea.create({
    data: { title, description, category, status },
  });

  return NextResponse.json(idea);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  if (data.title) data.title = stripHtml(data.title).trim();
  if (data.description !== undefined) data.description = stripHtml(data.description).trim();

  if (data.category) {
    const validCategories = ["post", "story", "reels"];
    if (!validCategories.includes(data.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  if (data.status) {
    const validStatuses = ["new", "in-progress", "done"];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const idea = await prisma.idea.update({
    where: { id },
    data,
  });

  return NextResponse.json(idea);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
