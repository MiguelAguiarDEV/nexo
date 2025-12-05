import { BottomNav } from "@/components/layouts/bottom-nav";
import { Sidebar } from "@/components/layouts/sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
