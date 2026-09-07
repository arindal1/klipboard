import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const kind = searchParams.get("kind");
  const language = searchParams.get("language");
  const tag = searchParams.get("tag");

  const notepads = await prisma.notepad.findMany({
    where: {
      userId: session.user.id,
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] } : {}),
      ...(kind === "TEXT" || kind === "CODE" ? { kind } : {}),
      ...(language ? { language } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ notepads });
}

const createSchema = z.object({
  title: z.string().min(1).max(120).default("Untitled"),
  kind: z.enum(["TEXT", "CODE"]).default("TEXT"),
  language: z.string().max(40).optional(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex string like #7ef2c9")
    .optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`notepad-write:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const notepad = await prisma.notepad.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ notepad }, { status: 201 });
}