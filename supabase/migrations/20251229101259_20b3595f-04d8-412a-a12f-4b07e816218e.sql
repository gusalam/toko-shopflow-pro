
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'kasir');
CREATE TYPE public.inventory_type AS ENUM ('in', 'out');
CREATE TYPE public.payment_method AS ENUM ('cash', 'qris', 'bank', 'credit');
CREATE TYPE public.transaction_status AS ENUM ('success', 'refund');
CREATE TYPE public.cash_book_type AS ENUM ('in', 'out');
CREATE TYPE public.cash_book_source AS ENUM ('transaction', 'purchase', 'manual');

-- =============================================
-- 1. USER PROFILES (tanpa role - role di tabel terpisah)
-- =============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 2. USER ROLES (tabel terpisah untuk keamanan)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =============================================
-- 3. PRODUCTS
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  buy_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  barcode TEXT UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. INVENTORY LOGS
-- =============================================
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  type inventory_type NOT NULL,
  qty INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5. SUPPLIERS
-- =============================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 6. SUPPLIER PURCHASES
-- =============================================
CREATE TABLE public.supplier_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.supplier_purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- =============================================
-- 7. CUSTOMERS
-- =============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 8. TRANSACTIONS
-- =============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice TEXT NOT NULL UNIQUE,
  cashier_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  shift_id UUID,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'success',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL
);

-- =============================================
-- 9. SHIFTS
-- =============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  start_cash NUMERIC NOT NULL DEFAULT 0,
  end_cash NUMERIC,
  total_sales NUMERIC DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Add shift_id FK to transactions
ALTER TABLE public.transactions 
ADD CONSTRAINT fk_transactions_shift 
FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE SET NULL;

-- =============================================
-- 10. CASH BOOKS
-- =============================================
CREATE TABLE public.cash_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type cash_book_type NOT NULL,
  source cash_book_source NOT NULL,
  reference_id UUID,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- SECURITY DEFINER FUNCTION (untuk cek role tanpa recursion)
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function untuk cek apakah user adalah admin atau kasir
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_kasir(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'kasir')
$$;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_books ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: USER_PROFILES
-- =============================================
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert profiles"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR id = auth.uid());

CREATE POLICY "Admin can delete profiles"
ON public.user_profiles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: USER_ROLES
-- =============================================
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: PRODUCTS
-- =============================================
CREATE POLICY "Everyone can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: INVENTORY_LOGS
-- =============================================
CREATE POLICY "Admin can view all inventory logs"
ON public.inventory_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert inventory logs"
ON public.inventory_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Kasir can insert inventory logs"
ON public.inventory_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_kasir(auth.uid()));

-- =============================================
-- RLS POLICIES: SUPPLIERS
-- =============================================
CREATE POLICY "Admin can manage suppliers"
ON public.suppliers FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: SUPPLIER_PURCHASES
-- =============================================
CREATE POLICY "Admin can manage supplier purchases"
ON public.supplier_purchases FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can manage supplier purchase items"
ON public.supplier_purchase_items FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: CUSTOMERS
-- =============================================
CREATE POLICY "Everyone can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Kasir can insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.is_kasir(auth.uid()));

-- =============================================
-- RLS POLICIES: TRANSACTIONS
-- =============================================
CREATE POLICY "Admin can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Kasir can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (cashier_id = auth.uid());

CREATE POLICY "Kasir can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  (public.is_kasir(auth.uid()) OR public.is_admin(auth.uid()))
  AND cashier_id = auth.uid()
);

CREATE POLICY "Admin can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: TRANSACTION_ITEMS
-- =============================================
CREATE POLICY "Admin can view all transaction items"
ON public.transaction_items FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Kasir can view own transaction items"
ON public.transaction_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id AND t.cashier_id = auth.uid()
  )
);

CREATE POLICY "Kasir can insert transaction items"
ON public.transaction_items FOR INSERT
TO authenticated
WITH CHECK (
  public.is_kasir(auth.uid()) OR public.is_admin(auth.uid())
);

-- =============================================
-- RLS POLICIES: SHIFTS
-- =============================================
CREATE POLICY "Admin can view all shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Kasir can view own shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (cashier_id = auth.uid());

CREATE POLICY "Kasir can manage own shifts"
ON public.shifts FOR INSERT
TO authenticated
WITH CHECK (
  (public.is_kasir(auth.uid()) OR public.is_admin(auth.uid()))
  AND cashier_id = auth.uid()
);

CREATE POLICY "Kasir can update own shifts"
ON public.shifts FOR UPDATE
TO authenticated
USING (cashier_id = auth.uid() OR public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: CASH_BOOKS
-- =============================================
CREATE POLICY "Admin can manage cash books"
ON public.cash_books FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- TRIGGERS: Auto create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Generate Invoice Number
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- =============================================
-- FUNCTION: Create Transaction (Atomic)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_transaction(
  p_items JSONB,
  p_customer_id UUID DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT 0,
  p_discount NUMERIC DEFAULT 0,
  p_tax NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0,
  p_payment_method payment_method DEFAULT 'cash',
  p_paid_amount NUMERIC DEFAULT 0,
  p_change_amount NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_shift_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_invoice TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
BEGIN
  -- Generate invoice
  v_invoice := public.generate_invoice_number();
  
  -- Insert transaction
  INSERT INTO public.transactions (
    invoice, cashier_id, customer_id, shift_id,
    subtotal, discount, tax, total,
    payment_method, paid_amount, change_amount, notes
  ) VALUES (
    v_invoice, auth.uid(), p_customer_id, p_shift_id,
    p_subtotal, p_discount, p_tax, p_total,
    p_payment_method, p_paid_amount, p_change_amount, p_notes
  ) RETURNING id INTO v_transaction_id;
  
  -- Insert transaction items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'qty')::INTEGER;
    
    -- Insert transaction item
    INSERT INTO public.transaction_items (
      transaction_id, product_id, product_name, qty, price, discount, subtotal
    ) VALUES (
      v_transaction_id,
      v_product_id,
      v_item->>'product_name',
      v_qty,
      (v_item->>'price')::NUMERIC,
      COALESCE((v_item->>'discount')::NUMERIC, 0),
      (v_item->>'subtotal')::NUMERIC
    );
    
    -- Update product stock
    UPDATE public.products
    SET stock = stock - v_qty
    WHERE id = v_product_id;
    
    -- Insert inventory log
    INSERT INTO public.inventory_logs (product_id, type, qty, note, created_by)
    VALUES (v_product_id, 'out', v_qty, 'Penjualan: ' || v_invoice, auth.uid());
  END LOOP;
  
  -- Insert cash book entry
  INSERT INTO public.cash_books (type, source, reference_id, amount, description, created_by)
  VALUES ('in', 'transaction', v_transaction_id, p_total, 'Penjualan: ' || v_invoice, auth.uid());
  
  -- Update shift totals if shift_id provided
  IF p_shift_id IS NOT NULL THEN
    UPDATE public.shifts
    SET 
      total_sales = COALESCE(total_sales, 0) + p_total,
      total_transactions = COALESCE(total_transactions, 0) + 1
    WHERE id = p_shift_id;
  END IF;
  
  RETURN v_transaction_id;
END;
$$;

-- =============================================
-- FUNCTION: Create Supplier Purchase (Atomic)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_supplier_purchase(
  p_supplier_id UUID,
  p_items JSONB,
  p_total NUMERIC,
  p_is_paid BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
BEGIN
  -- Insert purchase
  INSERT INTO public.supplier_purchases (supplier_id, total, is_paid, created_by)
  VALUES (p_supplier_id, p_total, p_is_paid, auth.uid())
  RETURNING id INTO v_purchase_id;
  
  -- Insert items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'qty')::INTEGER;
    
    -- Insert purchase item
    INSERT INTO public.supplier_purchase_items (purchase_id, product_id, qty, price)
    VALUES (
      v_purchase_id,
      v_product_id,
      v_qty,
      (v_item->>'price')::NUMERIC
    );
    
    -- Update product stock
    UPDATE public.products
    SET stock = stock + v_qty
    WHERE id = v_product_id;
    
    -- Insert inventory log
    INSERT INTO public.inventory_logs (product_id, type, qty, note, created_by)
    VALUES (v_product_id, 'in', v_qty, 'Pembelian supplier', auth.uid());
  END LOOP;
  
  -- Insert cash book if paid
  IF p_is_paid THEN
    INSERT INTO public.cash_books (type, source, reference_id, amount, description, created_by)
    VALUES ('out', 'purchase', v_purchase_id, p_total, 'Pembelian dari supplier', auth.uid());
  END IF;
  
  RETURN v_purchase_id;
END;
$$;

-- =============================================
-- FUNCTION: Check Active Shift
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_shift(p_cashier_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.shifts
  WHERE cashier_id = p_cashier_id
    AND closed_at IS NULL
  ORDER BY opened_at DESC
  LIMIT 1
$$;

-- =============================================
-- FUNCTION: Close Shift
-- =============================================
CREATE OR REPLACE FUNCTION public.close_shift(
  p_shift_id UUID,
  p_end_cash NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shifts
  SET 
    end_cash = p_end_cash,
    closed_at = NOW()
  WHERE id = p_shift_id
    AND cashier_id = auth.uid()
    AND closed_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_transactions_cashier ON public.transactions(cashier_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at);
CREATE INDEX idx_transactions_invoice ON public.transactions(invoice);
CREATE INDEX idx_shifts_cashier ON public.shifts(cashier_id);
CREATE INDEX idx_shifts_active ON public.shifts(cashier_id) WHERE closed_at IS NULL;
CREATE INDEX idx_inventory_logs_product ON public.inventory_logs(product_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
