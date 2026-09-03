/**
 * Tipos del esquema public.
 * Regenerar con acceso CLI: npm run types:generate
 *
 * Placeholder compatible con @supabase/supabase-js / @supabase/ssr.
 * Evita inferencia `never` en .from() / .rpc().
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      [table: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Views: {
      [view: string]: {
        Row: Record<string, any>;
        Relationships: [];
      };
    };
    Functions: {
      [fn: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      rol_usuario: "admin" | "gerente" | "cajero" | "mesero" | "cocina" | "contador";
      tipo_producto: "plato" | "bebida" | "combo";
      estado_mesa: "libre" | "ocupada" | "reservada" | "en_cuenta";
      tipo_movimiento_inventario: "entrada_compra" | "salida_venta" | "merma" | "ajuste";
      estado_pedido: "abierto" | "enviado" | "en_preparacion" | "servido" | "cerrado" | "anulado";
      tipo_pedido: "salon" | "para_llevar" | "delivery";
      estado_item_cocina: "pendiente" | "en_preparacion" | "listo" | "entregado";
      estado_comprobante: "abierta" | "cobrada" | "anulada";
      medio_pago: "efectivo" | "tarjeta" | "sinpe" | "mixto";
      estado_turno: "abierto" | "cerrado";
    };
    CompositeTypes: {
      [name: string]: Record<string, any>;
    };
  };
};
