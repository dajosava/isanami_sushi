import { z } from "zod";

export const pedidoItemSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  notas: z.string().max(200).optional(),
});

export const crearPedidoSchema = z
  .object({
    mesaId: z.string().uuid().optional().nullable(),
    tipo: z.enum(["salon", "para_llevar", "delivery"]).default("salon"),
    items: z.array(pedidoItemSchema).min(1, "El pedido necesita al menos un producto"),
    notas: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "salon" && !data.mesaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El pedido de salon requiere una mesa",
        path: ["mesaId"],
      });
    }
    if (data.tipo !== "salon" && data.mesaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los pedidos para llevar o delivery no usan mesa",
        path: ["mesaId"],
      });
    }
  });

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;

export const agregarItemsAPedidoSchema = z.object({
  pedidoId: z.string().uuid(),
  items: z.array(pedidoItemSchema).min(1, "Agrega al menos un producto"),
});

export type AgregarItemsAPedidoInput = z.infer<typeof agregarItemsAPedidoSchema>;

export const actualizarEstadoItemSchema = z.object({
  pedidoItemId: z.string().uuid(),
  estado: z.enum(["pendiente", "en_preparacion", "listo", "entregado"]),
});
