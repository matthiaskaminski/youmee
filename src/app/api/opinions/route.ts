import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripHtml } from "@/lib/validation";

export async function GET() {
  const opinions = await prisma.opinion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(opinions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const person = stripHtml(body.person || "").trim();
  const content = stripHtml(body.content || "").trim();
  const source = stripHtml(body.source || "").trim();

  if (!person || !content) {
    return NextResponse.json({ error: "Person and content are required" }, { status: 400 });
  }

  const opinion = await prisma.opinion.create({
    data: { person, content, source },
  });

  return NextResponse.json(opinion);
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

  await prisma.opinion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
