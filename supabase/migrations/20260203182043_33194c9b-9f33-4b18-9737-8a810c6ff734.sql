-- Add 'combined' to report_type enum
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'combined';

-- Add included_tests column to store which tests are in a combined report
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS included_tests text[] DEFAULT NULL;