
-- Fix function search_path for generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date TEXT;
  seq_num INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RETURN 'INV-' || today_date || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;
