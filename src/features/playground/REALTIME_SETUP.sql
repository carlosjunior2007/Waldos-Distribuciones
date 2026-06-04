-- Ejecuta esto una sola vez en Supabase SQL Editor si el realtime del playground no detecta cambios.
-- Sin esto, la presencia puede funcionar, pero los cambios de celdas pueden no llegar por postgres_changes.

ALTER TABLE public.playground_workbooks REPLICA IDENTITY FULL;
ALTER TABLE public.playground_sheets REPLICA IDENTITY FULL;
ALTER TABLE public.playground_cells REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playground_workbooks;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playground_sheets;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playground_cells;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
