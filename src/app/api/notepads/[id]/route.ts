import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

async function getOwnedNotepad(id: string, userId: string) {
  const notepad = await prisma.notepad.findUnique({ where: { id } });
  if (!notepad || notepad.userId !== userId) return null;
  return notepad;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notepad = await getOwnedNotepad(id, session.user.id);
  if (!notepad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ notepad });
}

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().optional(),
  kind: z.enum(["TEXT", "CODE"]).optional(),
  language: z.string().max(40).nullable().optional(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex string like #7ef2c9")
    .nullable()
    .optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`notepad-write:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const { id } = await params;
  const existing = await getOwnedNotepad(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const notepad = await prisma.notepad.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ notepad });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`notepad-write:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const { id } = await params;
  const existing = await getOwnedNotepad(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notepad.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}