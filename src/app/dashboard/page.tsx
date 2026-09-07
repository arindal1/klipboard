import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const notepads = await prisma.notepad.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  type NotepadRow = (typeof notepads)[number];

  return (
    <DashboardClient
      initialNotepads={notepads.map((n: NotepadRow) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))}
      userName={session.user.name ?? session.user.email ?? "there"}
    />
  );
}