-- Add new report types to the enum
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'screening_tests';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'blood_group_typing';