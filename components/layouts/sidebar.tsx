"use client";

import { ADMIN_EMAIL, adminItems, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = userEmail === ADMIN_EMAIL;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Settings className="h-3 w-3" />
              Admin
            </div>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
