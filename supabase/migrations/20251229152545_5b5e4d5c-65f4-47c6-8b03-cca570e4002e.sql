-- Enable realtime for cash_books table
ALTER TABLE public.cash_books REPLICA IDENTITY FULL;

-- Check if supabase_realtime publication exists and add table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cash_books'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_books;
  END IF;
END $$;