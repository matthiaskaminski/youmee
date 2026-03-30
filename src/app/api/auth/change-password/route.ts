import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Wymagane obecne i nowe haslo" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Nowe haslo musi miec minimum 8 znakow" },
      { status: 400 }
    );
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "Nie znaleziono uzytkownika" }, { status: 404 });
  }

  const isValid = await compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Obecne haslo jest nieprawidlowe" },
      { status: 400 }
    );
  }

  const hashed = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
