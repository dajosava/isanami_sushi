"use client";

import { Button } from "@/components/ui/button";

/** Márgenes de página mínimos solo durante la impresión del comprobante (papel térmico 80 mm). */
const ESTILO_PAGINA_TICKET = "@page { margin: 2mm 0; }";

export function PrintButton() {
  function imprimir() {
    const style = document.createElement("style");
    style.setAttribute("data-ticket-page", "");
    style.textContent = ESTILO_PAGINA_TICKET;
    document.head.appendChild(style);

    const limpiar = () => {
      style.remove();
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);

    window.print();
  }

  return (
    <Button type="button" variant="secondary" onClick={imprimir}>
      Imprimir / PDF
    </Button>
  );
}
