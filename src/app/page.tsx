import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import HomeClient from "./home-client";

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <HomeClient />;
}