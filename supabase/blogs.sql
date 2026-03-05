-- Create the blogs table
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to blogs
CREATE POLICY "Allow public read access to blogs"
ON public.blogs
FOR SELECT
USING (true);

-- Allow admins to manage blogs
CREATE POLICY "Allow admins to manage blogs"
ON public.blogs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);
