import type { ReportType } from '@/types/database';

/**
 * Check if a template code represents a custom (user-created) template
 * that needs special handling for database storage.
 * Custom templates use 'combined' report_type with the code in included_tests.
 */
export const isCustomTemplateCode = (code: string): boolean => {
  return code.startsWith('custom_') || code.startsWith('quick_');
};

/**
 * Determine the database report_type and data shape for saving a report.
 * Custom templates are stored as 'combined' with namespaced data.
 */
export const getReportSaveParams = (
  selectedTemplate: ReportType | string,
  reportData: Record<string, string | number | boolean | null>
): {
  reportType: ReportType;
  finalReportData: Record<string, unknown>;
  includedTests: string[] | null;
} => {
  if (isCustomTemplateCode(selectedTemplate)) {
    return {
      reportType: 'combined',
      finalReportData: { [selectedTemplate]: reportData },
      includedTests: [selectedTemplate],
    };
  }
  return {
    reportType: selectedTemplate as ReportType,
    finalReportData: reportData,
    includedTests: null,
  };
};
