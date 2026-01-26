-- Add full_name column
ALTER TABLE patients ADD COLUMN full_name text;

-- Migrate existing data by concatenating first_name and last_name
UPDATE patients SET full_name = first_name || ' ' || last_name;

-- Make full_name NOT NULL after migration
ALTER TABLE patients ALTER COLUMN full_name SET NOT NULL;

-- Drop old columns
ALTER TABLE patients DROP COLUMN first_name;
ALTER TABLE patients DROP COLUMN last_name;