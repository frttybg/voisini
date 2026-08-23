-- =====================================================================
-- VOISINI — seed.sql — kategoriler (6 dil)
-- =====================================================================
insert into public.categories (slug, icon, color, sort_order, name_fr, name_tr, name_en, name_de, name_ar, name_es) values
  ('electronics', 'cpu',       '#3B82F6',  1, 'Électronique',     'Elektronik',   'Electronics',   'Elektronik',      'إلكترونيات',      'Electrónica'),
  ('home',        'lamp',      '#F59E0B',  2, 'Maison & Vie',     'Ev & Yaşam',   'Home & Living', 'Haus & Wohnen',   'المنزل والمعيشة', 'Hogar y Vida'),
  ('furniture',   'armchair',  '#8B5CF6',  3, 'Meubles',          'Mobilya',      'Furniture',     'Möbel',           'أثاث',            'Muebles'),
  ('fashion',     'shirt',     '#EC4899',  4, 'Mode',             'Moda',         'Fashion',       'Mode',            'أزياء',           'Moda'),
  ('kids',        'baby',      '#14B8A6',  5, 'Enfants',          'Çocuk',        'Kids',          'Kinder',          'أطفال',           'Niños'),
  ('sports',      'bike',      '#22C55E',  6, 'Sport',            'Spor',         'Sports',        'Sport',           'رياضة',           'Deportes'),
  ('books',       'book',      '#EF4444',  7, 'Livres',           'Kitap',        'Books',         'Bücher',          'كتب',             'Libros'),
  ('vehicles',    'car',       '#0EA5E9',  8, 'Véhicules',        'Araç',         'Vehicles',      'Fahrzeuge',       'مركبات',          'Vehículos'),
  ('garden',      'sprout',    '#84CC16',  9, 'Jardin',           'Bahçe',        'Garden',        'Garten',          'حديقة',           'Jardín'),
  ('hobby',       'palette',   '#F97316', 10, 'Loisirs',          'Hobi',         'Hobby',         'Hobby',           'هوايات',          'Aficiones'),
  ('collectibles','gem',       '#A855F7', 11, 'Collection',       'Koleksiyon',   'Collectibles',  'Sammlerstücke',   'مقتنيات',         'Coleccionables'),
  ('tools',       'wrench',    '#64748B', 12, 'Outils',           'Alet',         'Tools',         'Werkzeuge',       'أدوات',           'Herramientas'),
  ('other',       'package',   '#78716C', 99, 'Autre',            'Diğer',        'Other',         'Sonstiges',       'أخرى',            'Otro')
on conflict (slug) do update set
  name_fr = excluded.name_fr, name_tr = excluded.name_tr, name_en = excluded.name_en,
  name_de = excluded.name_de, name_ar = excluded.name_ar, name_es = excluded.name_es,
  icon = excluded.icon, color = excluded.color, sort_order = excluded.sort_order;
