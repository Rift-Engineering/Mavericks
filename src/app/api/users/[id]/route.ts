import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_RESET_PASSWORD, hashPassword, requireAdmin } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const data: { role?: Role; passwordHash?: string } = {};

    if (typeof body.role === "string" && (body.role === "ADMIN" || body.role === "PLAYER")) {
      data.role = body.role;
    }

    if (body.resetPassword === true) {
      data.passwordHash = await hashPassword(DEFAULT_RESET_PASSWORD);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide role and/or resetPassword: true" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg === "Forbidden") {
      return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
