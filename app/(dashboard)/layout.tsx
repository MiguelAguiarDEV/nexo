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
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
