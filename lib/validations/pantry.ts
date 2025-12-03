import { z } from "zod";

export const addGrocerySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  quantity: z.number().int().positive().optional().default(1),
  unit: z.string().max(20).optional(),
  category: z.string().max(50).optional(),
});

export type AddGroceryInput = z.infer<typeof addGrocerySchema>;

export const groceryCategories = [
  { value: "frutas", label: "Frutas" },
  { value: "verduras", label: "Verduras" },
  { value: "lacteos", label: "Lácteos" },
  { value: "carnes", label: "Carnes" },
  { value: "pescados", label: "Pescados" },
  { value: "panaderia", label: "Panadería" },
  { value: "bebidas", label: "Bebidas" },
  { value: "limpieza", label: "Limpieza" },
  { value: "higiene", label: "Higiene" },
  { value: "otros", label: "Otros" },
] as const;
