import {
  Calendar,
  Home,
  ListTodo,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    title: "Inicio",
    href: "/home",
    icon: Home,
  },
  {
    title: "Agenda",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Compras",
    href: "/shopping",
    icon: ShoppingCart,
  },
  {
    title: "Finanzas",
    href: "/finance",
    icon: Receipt,
  },
  {
    title: "Tareas",
    href: "/chores",
    icon: ListTodo,
  },
];
