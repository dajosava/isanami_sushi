"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { actualizarConfiguracion } from "@/actions/admin.actions";

interface Config {
  nombre_comercial: string;
  cedula_juridica: string | null;
  telefono: string | null;
  email_facturacion: string | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  senas_exactas: string | null;
}

export function ConfigForm({ config }: { config: Config }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nombre_comercial: config.nombre_comercial ?? "",
    cedula_juridica: config.cedula_juridica ?? "",
    telefono: config.telefono ?? "",
    email_facturacion: config.email_facturacion ?? "",
    provincia: config.provincia ?? "",
    canton: config.canton ?? "",
    distrito: config.distrito ?? "",
    senas_exactas: config.senas_exactas ?? "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await actualizarConfiguracion(form);
      if (!result.ok) {
        toast(result.error, "peligro");
        return;
      }
      toast("Configuracion guardada", "exito");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        placeholder="Nombre comercial"
        value={form.nombre_comercial}
        onChange={(e) => setField("nombre_comercial", e.target.value)}
        required
      />
      <Input
        placeholder="Cedula juridica"
        value={form.cedula_juridica}
        onChange={(e) => setField("cedula_juridica", e.target.value)}
      />
      <Input
        placeholder="Telefono"
        value={form.telefono}
        onChange={(e) => setField("telefono", e.target.value)}
      />
      <Input
        type="email"
        placeholder="Email facturacion"
        value={form.email_facturacion}
        onChange={(e) => setField("email_facturacion", e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Provincia"
          value={form.provincia}
          onChange={(e) => setField("provincia", e.target.value)}
        />
        <Input
          placeholder="Canton"
          value={form.canton}
          onChange={(e) => setField("canton", e.target.value)}
        />
        <Input
          placeholder="Distrito"
          value={form.distrito}
          onChange={(e) => setField("distrito", e.target.value)}
        />
      </div>
      <Textarea
        placeholder="Senas exactas"
        value={form.senas_exactas}
        onChange={(e) => setField("senas_exactas", e.target.value)}
        rows={3}
      />
      <Button type="submit" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}
