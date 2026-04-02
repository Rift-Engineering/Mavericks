import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status !== "OPTIMISED") {
    return NextResponse.json(
      { error: "Session must be in Optimised state before publishing" },
      { status: 400 },
    );
  }

  await prisma.session.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  return NextResponse.json({ ok: true });
}
