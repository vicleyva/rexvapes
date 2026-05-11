-- Rexvapes Seed Data
-- Run this after schema.sql to populate initial data

-- Insert model
INSERT INTO models (name, puffs, price) VALUES
  ('iPlay Max 2500', 2500, 200.00);

-- Get the model ID
DO $$
DECLARE
  model_id UUID;
BEGIN
  SELECT id INTO model_id FROM models WHERE name = 'iPlay Max 2500' LIMIT 1;

  -- Insert all flavors
  INSERT INTO flavors (model_id, name, name_es, stock) VALUES
    (model_id, 'Coconut Ice', 'Helado de Coco', 1),
    (model_id, 'Cucumber Lemonade', 'Limonada de Pepino', 1),
    (model_id, 'Iced Coffee', 'Café Helado', 4),
    (model_id, 'Kiwi Dragon Berry', 'Kiwi / Fruta del Dragón / Bayas', 3),
    (model_id, 'Blue Razz Lemon', 'Limón / Frambuesa Azul', 0),
    (model_id, 'Peach Ice', 'Durazno Fresco', 1),
    (model_id, 'Banana Cherry Dragon Fruit', 'Fruta del Dragón / Cereza / Plátano', 0),
    (model_id, 'Pineapple Orange Guava', 'Guayaba / Naranja / Piña', 1),
    (model_id, 'Energy Drink', 'Red Bull', 5),
    (model_id, 'Black Dragon Fruit', 'Fruta del Dragón', 3),
    (model_id, 'Blueberry Rainbow', 'Mora Azul / Arándano / Fresa', 2),
    (model_id, 'Sour Apple Melon', 'Melón / Manzana Ácida', 1),
    (model_id, 'Coconut Strawberry', 'Fresa / Coco', 0),
    (model_id, 'Sour Raspberry', 'Frambuesa Agria', 1),
    (model_id, 'Peach Berries Ice', 'Helado de Durazno / Bayas', 3),
    (model_id, 'Cranberry Grape', 'Uva / Arándano', 0),
    (model_id, 'Pineapple Coconut', 'Coco / Piña', 3),
    (model_id, 'Cool Mint', 'Menta Fresca', 1),
    (model_id, 'Double Mint', 'Doble Menta', 0),
    (model_id, 'Black Mint', 'Menta Fuerte', 0);
END $$;
