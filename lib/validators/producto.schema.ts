import { z } from "zod";
import { LIMITES } from "@/lib/limites-campos";

export const productoSchema = z.object({
  categoriaId: z.string().uuid(),
  nombre: z.string().trim().min(2).max(LIMITES.productoNombre),
  descripcion: z.string().max(500).optional(),
  precioVenta: z.number().nonnegative().max(LIMITES.precioMax),
  impuestoIvaPct: z.number().min(0).max(100).default(13),
  tipo: z.enum(["plato", "bebida", "combo"]),
  activo: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof productoSchema>;

export const recetaItemSchema = z.object({
  insumoId: z.string().uuid(),
  cantidadRequerida: z.number().positive(),
  unidadMedidaId: z.string().uuid(),
});
