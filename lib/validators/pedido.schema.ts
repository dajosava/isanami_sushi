import { z } from "zod";

const NOMBRE_CLIENTE_MAX = 25;

/** Letras, números, espacios, guion y apóstrofe. Máx. 25 caracteres. */
export const NOMBRE_CLIENTE_REGEX = /^[\p{L}\p{N}]+(?:[ '\-][\p{L}\p{N}]+)*$/u;

export function esNombreClienteValido(nombre: string): boolean {
  const n = nombre.trim().replace(/\s+/g, " ");
  return n.length >= 2 && n.length <= NOMBRE_CLIENTE_MAX && NOMBRE_CLIENTE_REGEX.test(n);
}

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
    nombreCliente: z.string().trim().max(NOMBRE_CLIENTE_MAX).optional().nullable(),
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
    if (data.tipo === "para_llevar" || data.tipo === "delivery") {
      const nombre = (data.nombreCliente ?? "").trim().replace(/\s+/g, " ");
      if (!nombre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El nombre de quien pide es obligatorio",
          path: ["nombreCliente"],
        });
      } else if (nombre.length > NOMBRE_CLIENTE_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El nombre no puede superar ${NOMBRE_CLIENTE_MAX} caracteres`,
          path: ["nombreCliente"],
        });
      } else if (!esNombreClienteValido(nombre)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El nombre no es válido",
          path: ["nombreCliente"],
        });
      }
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
