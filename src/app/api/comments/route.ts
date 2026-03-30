import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, content } = await req.json();

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId: session.user.id,
    },
    include: {
      user: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(comment);
}
