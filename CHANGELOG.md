# Changelog

Todos los cambios notables del proyecto Isanami Sushi.

## 2026-09-21

### Inventario
- Los insumos se pueden **eliminar** desde el listado (admin/gerente). Bloqueado si está en recetas o en compras; limpia movimientos asociados.
- Migración `0031_movimientos_delete_insumo.sql`.

### Contabilidad — reportes contador
- **Reporte mensual** (`/contabilidad/reportes/mensual`): ventas, IVA cobrado, compras, IVA 13%/1% pagado, diferencia aproximada Hacienda.
- **Reporte anual** (`/contabilidad/reportes/anual`): ventas, compras (mercadería), gastos operativos, salarios estimados (planilla), ganancia aproximada.
- Hub en `/contabilidad/reportes`; cierres diarios en `/contabilidad/reportes/cierres`.
- Export CSV: `GET /api/exportar/contabilidad?tipo=mensual|anual&anio=&mes=`.
- Migración `0030_contabilidad_reportes_contador.sql` (RPCs `reporte_contador_mensual`, `reporte_contador_anual`).

### Planilla
- Resumen de pago incluye **todos los colaboradores activos** (0 h si no hay registros) para admin, gerente y contador.
- Exportación **CSV**: resumen (horas, tarifas, pago estimado) y detalle (entrada/salida por día).
- API `GET /api/exportar/planilla?desde=&hasta=&tipo=resumen|detalle`.

### Compras y gastos
- Facturas con **proveedor, fecha editable, nº de factura, subtotal, IVA (13% / 1% / exento) y total**.
- **Clasificación del gasto**: mercadería, limpieza, publicidad, alquiler, servicios públicos, mantenimiento, otros.
- Gastos no mercadería: concepto + monto (sin líneas de inventario).
- Mercadería: sigue sumando stock al registrar insumos.
- Migración `0029_compras_gastos.sql`.

## 2026-09-20

### Ventas (antes Facturación)
- Renombrado el módulo **Facturación** a **Ventas** (`/ventas`); las rutas `/facturacion` redirigen a `/ventas`.
- Filtro por fechas con atajos **Hoy / Semana / Mes / Año** y rango personalizado.
- Resumen del periodo: totales (ventas, órdenes, ticket, IVA), medios de pago y productos más/menos vendidos (RPCs de analítica).
- Migración `0027_analytics_access_cajero.sql`: el cajero puede consultar esas RPCs para el resumen operativo.

### Inventario
- Panel de alertas de stock (negativo / sin stock / reabastecer), listado ordenado por riesgo y badges.
- Edición rápida de **stock mínimo** en el listado de insumos.
- Banner y priorización de productos activos **sin receta**.
- Nota en Compras: el stock sube al comprar; el descuento es al **cobrar** según receta.
- Formulario de recetas con **varias líneas** de ingredientes (agregar/quitar) y guardado en lote.
- Etiquetas y opciones “Selecciona…” en el formulario de recetas.
- Compras: proveedor e insumo como **texto libre** (crea catálogo si es nuevo); cada línea guarda **unidad de medida** (kg, g, l, paquete…).
- Migración `0028_compras_unidad_medida.sql`.

### Formularios (UX)
- Placeholders y/o etiquetas en campos de entrada en login, menú, usuarios, mesas, config, inventario, ventas/cobro, pedidos, planilla y caja.

### Contabilidad / Analítica (contexto previo del ciclo)
- Base lista para reportes IVA/renta; compras ya guardan subtotal/IVA/categoría (reportes contables pendientes).

### Migraciones relevantes
- `0025` cobro dividido (comprobante multi-pago).
- `0026` una comanda por envío (cocina sin partir por categoría).
- `0027` acceso analítica para cajero.
- `0028` unidad de medida en líneas de compra (+ paquete/caja/libra).
- `0029` compras/gastos: subtotal, IVA, categoría y concepto.
- `0030` reportes contador mensual/anual (RPC).
- `0031` DELETE en movimientos_inventario (admin/gerente, al eliminar insumos).
