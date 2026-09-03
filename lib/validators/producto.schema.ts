import { z } from "zod";

export const productoSchema = z.object({
  categoriaId: z.string().uuid(),
  nombre: z.string().min(2).max(120),
  descripcion: z.string().max(500).optional(),
  precioVenta: z.number().positive(),
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
