import { z } from "zod";

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)")
  .optional()
  .nullable();

export const upsertPlanillaSchema = z
  .object({
    id: z.string().uuid().optional(),
    usuarioId: z.string().uuid("Selecciona un colaborador"),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    horaEntrada: horaSchema,
    horaSalida: horaSchema,
    notas: z.string().trim().max(300).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.horaEntrada && !data.horaSalida) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica al menos hora de entrada o salida",
        path: ["horaEntrada"],
      });
    }
    if (data.horaEntrada && data.horaSalida && data.horaSalida < data.horaEntrada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La salida no puede ser antes que la entrada",
        path: ["horaSalida"],
      });
    }
  });

export type UpsertPlanillaInput = z.infer<typeof upsertPlanillaSchema>;

export const marcarPlanillaSchema = z.object({
  tipo: z.enum(["entrada", "salida"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
