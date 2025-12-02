import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a nexo</h1>
        <p className="text-muted-foreground mt-2">
          Tu centro de gestión personal y convivencia
        </p>
      </div>
    </div>
  );
}
