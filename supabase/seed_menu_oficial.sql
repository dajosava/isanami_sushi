-- ============================================================================
-- Menú oficial Isanami (seguro de re-ejecutar)
-- Ejecutar en Supabase SQL Editor después de las migraciones.
-- ============================================================================

-- Desactivar productos de prueba anteriores
update public.productos
set activo = false
where nombre in (
  'Sushi Isanami especial',
  'California roll',
  'Sashimi de salmon (5 pz)',
  'Gyoza de cerdo',
  'Te verde'
);

insert into public.categorias_menu (nombre, orden)
select v.nombre, v.orden
from (values
  ('Entradas', 1),
  ('Bombas de arroz', 2),
  ('Maki rolls', 3),
  ('Rollos clásicos', 4),
  ('Super roll', 5),
  ('Rollos especiales y tempuras', 6),
  ('Rollos exclusivos', 7),
  ('Combos to share', 8),
  ('Poke bowl', 9),
  ('Sushi burger', 10),
  ('Bebidas', 11),
  ('Postres', 12)
) as v(nombre, orden)
where not exists (
  select 1 from public.categorias_menu c where c.nombre = v.nombre
);

insert into public.productos (categoria_id, nombre, descripcion, precio_venta, tipo)
select c.id, p.nombre, p.descripcion, p.precio, p.tipo::public.tipo_producto
from (values
  -- Entradas
  ('Entradas', 'Sopa miso', 'Caldo dashi, pasta de miso, tofu en cubos, cebollino y alga.', 2500, 'plato'),
  ('Entradas', 'Arroz yakimeshi', 'Arroz frito, pollo, cebollino y verduras picadas.', 3000, 'plato'),
  ('Entradas', 'Seaweed salad', 'Algas wakame, zanahoria, ajonjolí y edamames.', 3500, 'plato'),
  ('Entradas', 'Edamames', 'Vainas de soya tierna cocinadas al vapor con un toque de sal.', 3500, 'plato'),
  ('Entradas', 'Gyozas', 'Empanadas japonesas (vegetales, camarón o cerdo). Vapor o fritas.', 3500, 'plato'),
  ('Entradas', 'Spring roll', 'Rollos primavera fritos de vegetales con salsa agridulce.', 3500, 'plato'),
  ('Entradas', 'Mozzarella sticks', 'Palitos de mozzarella fritos con salsa marinara.', 3500, 'plato'),
  ('Entradas', 'Pollo tempura', 'Pollo frito con chips de camote o papa y salsas.', 4500, 'plato'),
  ('Entradas', 'Camarones tempura', 'Camarones fritos con chips de camote o papa y salsas.', 5000, 'plato'),
  ('Entradas', 'Tartar de atún', 'Atún crudo finamente picado con aderezos asiáticos.', 5500, 'plato'),
  ('Entradas', 'Tartar de atún y salmón', 'Atún y salmón crudos con aderezos asiáticos.', 6000, 'plato'),
  ('Entradas', 'Aros de calamar tempura', 'Aros de calamar fritos con chips de camote o papa y salsas.', 4500, 'plato'),

  -- Bombas de arroz
  ('Bombas de arroz', 'Bomba de arroz crujiente (2 uds)', 'Rellenas con queso crema y proteína a escoger: salmón, atún o ensalada de kanikama.', 4000, 'plato'),
  ('Bombas de arroz', 'Bomba de arroz flambeada (2 uds)', 'Rellenas de aguacate y queso crema, cubiertas con salmón o atún flambeado.', 4000, 'plato'),

  -- Maki rolls
  ('Maki rolls', 'Kappa maki', 'Pepino.', 2500, 'plato'),
  ('Maki rolls', 'Avocado maki', 'Aguacate.', 2000, 'plato'),
  ('Maki rolls', 'Kanikama maki', 'Surimi.', 3000, 'plato'),
  ('Maki rolls', 'Tekka maki', 'Atún.', 3000, 'plato'),
  ('Maki rolls', 'Salmón maki', 'Salmón.', 3000, 'plato'),

  -- Rollos clásicos
  ('Rollos clásicos', 'Vegetable roll', 'Zanahoria, pepino, remolacha, aguacate, lechuga, ajonjolí.', 4000, 'plato'),
  ('Rollos clásicos', 'California roll', 'Kanikama, aguacate, pepino, ajonjolí.', 4500, 'plato'),
  ('Rollos clásicos', 'Philadelphia roll', 'Salmón, queso crema, aguacate, ajonjolí.', 5000, 'plato'),
  ('Rollos clásicos', 'Spicy tuna', 'Atún, cebollino, aguacate, sriracha, ajonjolí y cebollino.', 5500, 'plato'),
  ('Rollos clásicos', 'Spicy salmon', 'Salmón, cebollino, aguacate, sriracha, ajonjolí y cebollino.', 5500, 'plato'),

  -- Super roll
  ('Super roll', 'Super roll salmón o atún', 'Maki envuelto en panko. Aguacate, queso crema, pepino, zanahoria y remolacha.', 4500, 'plato'),
  ('Super roll', 'Super roll pollo o camarón', 'Maki envuelto en panko. Aguacate, queso crema, pepino, zanahoria y remolacha.', 5500, 'plato'),
  ('Super roll', 'Super roll mixto', 'Maki envuelto en panko. Dos opciones de proteína.', 5000, 'plato'),

  -- Rollos especiales y tempuras
  ('Rollos especiales y tempuras', 'Tico vegetariano', 'Vegetales cubiertos con plátano maduro.', 4500, 'plato'),
  ('Rollos especiales y tempuras', 'Vegetariano tempura', 'Vegetales cubiertos con tempura.', 4500, 'plato'),
  ('Rollos especiales y tempuras', 'California tempura', 'Kanikama, pepino, aguacate, ajonjolí, cubierto en tempura.', 5000, 'plato'),
  ('Rollos especiales y tempuras', 'Crunchy roll', 'Pollo tempura, aguacate, queso crema, ajonjolí, cubierto de crispy.', 5000, 'plato'),
  ('Rollos especiales y tempuras', 'Kanikama roll', 'Kanikama, aguacate, pepino, ajonjolí, queso crema y kanikama.', 5000, 'plato'),
  ('Rollos especiales y tempuras', 'Salmón skin', 'Piel de salmón frita, queso crema, aguacate, ajonjolí, crispy y piel de salmón.', 5000, 'plato'),
  ('Rollos especiales y tempuras', 'Scorpion roll', 'Camarón tempura, queso crema, aguacate, ajonjolí, cubierto con crispy.', 5500, 'plato'),
  ('Rollos especiales y tempuras', 'Tico roll', 'Camarón tempura, queso crema, aguacate, ajonjolí, cubierto con plátano maduro.', 5500, 'plato'),
  ('Rollos especiales y tempuras', 'Shrimp roll', 'Camarón tempura, queso crema, pepino, cubierto con camarón ebi y aguacate.', 6000, 'plato'),
  ('Rollos especiales y tempuras', 'Caterpillar', 'Camarón tempura, queso crema, pepino, ajonjolí, cubierto con aguacate.', 6500, 'plato'),
  ('Rollos especiales y tempuras', 'Tempura roll', 'Salmón, aguacate, queso crema, ajonjolí, cubierto en tempura.', 6000, 'plato'),

  -- Rollos exclusivos
  ('Rollos exclusivos', 'Isanami especial', 'Salmón, atún, aguacate, ajonjolí, cubierto con salmón flambeado y seaweed salad.', 7000, 'plato'),
  ('Rollos exclusivos', 'Explosión de camarón o pollo', 'Tempura, queso crema, pepino, ajonjolí, crispy y ensalada de kanikama.', 6000, 'plato'),
  ('Rollos exclusivos', 'Tokio roll', 'Piel de salmón, zanahoria, queso crema, ajonjolí, aguacate y atún marinado.', 7000, 'plato'),
  ('Rollos exclusivos', 'Afrodita roll', 'Calamar tempura, queso crema, aguacate, plátano maduro, camarón en salsa ceviche.', 6500, 'plato'),
  ('Rollos exclusivos', 'Calamar roll', 'Calamar tempura, zanahoria, aguacate, ajonjolí, queso crema y masago.', 6000, 'plato'),
  ('Rollos exclusivos', 'Rainbow roll', 'Salmón, atún, aguacate, ajonjolí, cubierto con salmón, atún, aguacate y mayo de rábano.', 6500, 'plato'),
  ('Rollos exclusivos', 'Dragon roll', 'Salmón flambeado, queso crema, pepino, plátano maduro, wakame y huevos de pescado.', 7500, 'plato'),
  ('Rollos exclusivos', 'Hiroshima roll', 'Ensalada de kanikama, queso crema, pepino, cubierto con crispy roja.', 5000, 'plato'),

  -- Combos
  ('Combos to share', 'Combo 1 (26 piezas)', '10 California tempura, 8 crunchy roll y 8 tico roll.', 15000, 'combo'),
  ('Combos to share', 'Combo 2 (42 piezas)', '10 tempura roll, 8 explosión de camarón, 8 crunchy roll, 8 tico roll, 8 tuna maki.', 25000, 'combo'),

  -- Poke bowl
  ('Poke bowl', 'Isanami poke', 'Base de arroz, toppings y salmón con atún.', 7000, 'plato'),
  ('Poke bowl', 'Tuna poke', 'Base de arroz, toppings y atún.', 6500, 'plato'),
  ('Poke bowl', 'Salmon poke', 'Base de arroz, toppings y salmón.', 6500, 'plato'),
  ('Poke bowl', 'Camarón poke', 'Panko, teriyaki o al ajillo.', 6000, 'plato'),
  ('Poke bowl', 'Pollo poke', 'Panko o teriyaki.', 5500, 'plato'),
  ('Poke bowl', 'Vegetariano poke', 'Rollos primavera o gyozas.', 4500, 'plato'),
  ('Poke bowl', 'Extra proteína poke', 'Porción adicional de proteína.', 1800, 'plato'),
  ('Poke bowl', 'Extra topping poke', 'Topping adicional.', 700, 'plato'),
  ('Poke bowl', 'Extra salsa poke', 'Salsa adicional.', 500, 'plato'),

  -- Sushi burger
  ('Sushi burger', 'Sushi burger', 'Aguacate, queso crema, kanikama y wakame salad.', 5000, 'plato'),
  ('Sushi burger', 'Sushi burger pollo teriyaki', 'Hamburguesa de sushi con pollo teriyaki.', 5500, 'plato'),
  ('Sushi burger', 'Sushi burger camarón teriyaki', 'Hamburguesa de sushi con camarón teriyaki.', 6100, 'plato'),
  ('Sushi burger', 'Sushi burger salmón o atún', 'Hamburguesa de sushi con salmón o atún.', 6100, 'plato'),

  -- Bebidas
  ('Bebidas', 'Batido en agua', 'Batido de frutas en agua.', 1500, 'bebida'),
  ('Bebidas', 'Batido en leche', 'Batido de frutas en leche.', 2000, 'bebida'),
  ('Bebidas', 'Batido con helado', 'Batido con helado (extra).', 500, 'bebida'),
  ('Bebidas', 'Soju con alcohol', 'Bebida alcohólica coreana.', 3500, 'bebida'),
  ('Bebidas', 'Gaseosa', 'Refresco.', 1200, 'bebida'),

  -- Postres
  ('Postres', 'Helado tempura', 'Helado cubierto en tempura.', 3500, 'plato'),
  ('Postres', 'Banano tempura', 'Banano frito en tempura.', 2500, 'plato'),
  ('Postres', 'Wonton', 'Rellenos de dulce de leche y queso.', 3500, 'plato')
) as p(categoria, nombre, descripcion, precio, tipo)
join public.categorias_menu c on c.nombre = p.categoria
where not exists (
  select 1 from public.productos pr where pr.nombre = p.nombre
);

-- Actualizar orden de categorías existentes
update public.categorias_menu c
set orden = v.orden
from (values
  ('Entradas', 1),
  ('Bombas de arroz', 2),
  ('Maki rolls', 3),
  ('Rollos clásicos', 4),
  ('Super roll', 5),
  ('Rollos especiales y tempuras', 6),
  ('Rollos exclusivos', 7),
  ('Combos to share', 8),
  ('Poke bowl', 9),
  ('Sushi burger', 10),
  ('Bebidas', 11),
  ('Postres', 12)
) as v(nombre, orden)
where c.nombre = v.nombre;

-- Mover bombas de arroz si ya estaban bajo Entradas
update public.productos p
set categoria_id = c.id
from public.categorias_menu c
where c.nombre = 'Bombas de arroz'
  and p.nombre in (
    'Bomba de arroz crujiente (2 uds)',
    'Bomba de arroz flambeada (2 uds)'
  );

-- Quitar categorías de prueba antiguas (del seed inicial)
delete from public.categorias_menu
where nombre in ('Sushi rolls', 'Sashimi', 'Platos calientes');
