-- ============================================================================
-- Match: insumos de gaseosas → categoría menú "Gaseosas" + receta 1:1
-- Ejecutar en el SQL Editor de Supabase (producción / staging).
-- Precio por defecto: ₡1.200. Ajusta después en Admin → Menú si hace falta.
-- ============================================================================

do $$
declare
  v_categoria_id uuid;
  v_insumo record;
  v_producto_id uuid;
  v_nombre text;
  v_nombres text[] := array[
    'Coca cero',
    'Coca regular',
    'Fanta naranja',
    'Fresa',
    'Fresca',
    'Gin'
  ];
begin
  select id into v_categoria_id
  from categorias_menu
  where nombre = 'Gaseosas'
  limit 1;

  if v_categoria_id is null then
    insert into categorias_menu (nombre, orden)
    values ('Gaseosas', 12)
    returning id into v_categoria_id;
  end if;

  -- Empujar Postres después de Gaseosas si quedó en el mismo orden
  update categorias_menu
  set orden = 13
  where nombre = 'Postres'
    and orden <= 12;

  foreach v_nombre in array v_nombres
  loop
    select i.id, i.nombre, i.unidad_medida_id
    into v_insumo
    from insumos i
    where lower(trim(i.nombre)) = lower(trim(v_nombre))
    limit 1;

    if v_insumo.id is null then
      raise notice 'Insumo no encontrado (omitido): %', v_nombre;
      continue;
    end if;

    select p.id into v_producto_id
    from productos p
    where lower(trim(p.nombre)) = lower(trim(v_insumo.nombre))
    order by p.activo desc, p.creado_en asc
    limit 1;

    if v_producto_id is null then
      insert into productos (
        categoria_id,
        nombre,
        descripcion,
        precio_venta,
        impuesto_iva_pct,
        tipo,
        activo
      )
      values (
        v_categoria_id,
        v_insumo.nombre,
        'Gaseosa.',
        1200,
        13,
        'bebida',
        true
      )
      returning id into v_producto_id;
      raise notice 'Producto creado en Gaseosas: %', v_insumo.nombre;
    else
      update productos
      set
        nombre = v_insumo.nombre,
        categoria_id = v_categoria_id,
        tipo = 'bebida',
        activo = true,
        precio_venta = coalesce(nullif(precio_venta, 0), 1200),
        descripcion = coalesce(nullif(trim(descripcion), ''), 'Gaseosa.')
      where id = v_producto_id;
      raise notice 'Producto movido a Gaseosas: %', v_insumo.nombre;
    end if;

    insert into recetas (producto_id, insumo_id, cantidad_requerida, unidad_medida_id)
    values (v_producto_id, v_insumo.id, 1, v_insumo.unidad_medida_id)
    on conflict (producto_id, insumo_id) do update
      set cantidad_requerida = excluded.cantidad_requerida,
          unidad_medida_id = excluded.unidad_medida_id;

    raise notice 'Receta 1:1 lista: %', v_insumo.nombre;
  end loop;

  -- La gaseosa genérica del seed ya no se vende (quedan las marcas).
  update productos
  set activo = false
  where lower(trim(nombre)) = 'gaseosa'
    and activo = true;

  raise notice 'Listo: gaseosas en categoría Gaseosas. Desactivada Gaseosa genérica si existía.';
end;
$$;
