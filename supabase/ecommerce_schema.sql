-- E-commerce Reseller Feature Schema Update

-- 1. Update Commission Type ENUM
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'RESELLER';

-- 2. Create Enums for E-commerce
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Tables
-- Products Table
CREATE TABLE IF NOT EXISTS public.ecommerce_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    gallery TEXT[] DEFAULT '{}',
    wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    suggested_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS public.ecommerce_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.ecommerce_products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.ecommerce_products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    selling_price NUMERIC(10,2) NOT NULL,
    total_wholesale_price NUMERIC(10,2) NOT NULL,
    total_selling_price NUMERIC(10,2) NOT NULL,
    profit NUMERIC(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.ecommerce_products(category);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.ecommerce_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.ecommerce_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.ecommerce_orders(status);

-- 5. Trigger for updated_at on orders
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ecommerce_orders_updated_at ON public.ecommerce_orders;
CREATE TRIGGER trg_update_ecommerce_orders_updated_at
BEFORE UPDATE ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();

-- 6. Trigger for Profit Commission on DELIVERED
CREATE OR REPLACE FUNCTION handle_ecommerce_order_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to DELIVERED
    IF NEW.status = 'DELIVERED' AND OLD.status != 'DELIVERED' THEN
        -- Insert commission for the reseller
        INSERT INTO public.commissions (
            user_id,
            source_user_id, -- Using reseller's own ID or we could leave it null if allowed. Schema says NO NULL. We'll use the reseller's ID as source_user_id since they generated it.
            amount,
            type
        ) VALUES (
            NEW.user_id,
            NEW.user_id,
            NEW.profit,
            'RESELLER'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ecommerce_order_delivery ON public.ecommerce_orders;
CREATE TRIGGER trg_ecommerce_order_delivery
AFTER UPDATE ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION handle_ecommerce_order_delivery();

-- 7. RLS Policies
-- Enable RLS
ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Products: Admins can do all, anyone can read
DROP POLICY IF EXISTS "products_admin_all" ON public.ecommerce_products;
CREATE POLICY "products_admin_all" ON public.ecommerce_products
FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN' );

DROP POLICY IF EXISTS "products_read_all" ON public.ecommerce_products;
CREATE POLICY "products_read_all" ON public.ecommerce_products
FOR SELECT USING (true);

-- Favorites: Users manage their own
DROP POLICY IF EXISTS "favorites_user_own" ON public.ecommerce_favorites;
CREATE POLICY "favorites_user_own" ON public.ecommerce_favorites
FOR ALL USING (user_id = auth.uid());

-- Orders: Admins can do all, Users can manage their own
DROP POLICY IF EXISTS "orders_admin_all" ON public.ecommerce_orders;
CREATE POLICY "orders_admin_all" ON public.ecommerce_orders
FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN' );

DROP POLICY IF EXISTS "orders_user_own" ON public.ecommerce_orders;
CREATE POLICY "orders_user_own" ON public.ecommerce_orders
FOR ALL USING (user_id = auth.uid());

-- Grant permissions (if needed, already granted on schema public to authenticated usually, but good measure)
GRANT ALL ON public.ecommerce_products TO authenticated;
GRANT ALL ON public.ecommerce_favorites TO authenticated;
GRANT ALL ON public.ecommerce_orders TO authenticated;
GRANT SELECT ON public.ecommerce_products TO anon;
