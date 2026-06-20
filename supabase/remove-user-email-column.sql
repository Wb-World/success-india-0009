-- ============================================================
-- SQL Migration: Remove Email Column from Users Table
-- Execute this script in your Supabase SQL Editor.
-- ============================================================

-- Drop the email column from public.users table.
-- This also drops any unique constraints and indexes associated with the email column.
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
