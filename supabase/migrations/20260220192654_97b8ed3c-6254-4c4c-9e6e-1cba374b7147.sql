-- Add cover_image column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cover_image text;