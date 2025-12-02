import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/home");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
      <div className="text-center space-y-8 max-w-lg">
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter">
          nexo
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Tu agenda personal y de convivencia
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/sign-up">Registrarse</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8"
          >
            <Link href="/sign-in">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
