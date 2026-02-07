import { useMemo } from 'react';
import type { Report, Gender, TestField, ReportTemplate } from '@/types/database';
import { reportTemplates, buildCombinedTemplate, flattenCombinedReportData } from '@/lib/report-templates';

export type TrendType = 'improved' | 'declined' | 'stable' | 'new' | 'removed' | 'unchanged';

export interface MultiComparisonResult {
  fieldName: string;
  fieldLabel: string;
  unit: string;
  values: (number | string | null)[];
  statuses: ('normal' | 'abnormal' | 'unknown')[];
  overallTrend: TrendType;
  normalRange: string;
  category: string;
  firstValue: number | string | null;
  lastValue: number | string | null;
  percentChangeOverall: number | null;
}

interface UseMultiReportComparisonResult {
  comparison: MultiComparisonResult[];
  commonFields: string[];
  fieldAvailability: Map<string, boolean[]>;
  reportDates: string[];
  uniqueFields: Map<string, number[]>; // Field name -> array of report indices that have it
}

// Get template for a report (handles combined reports)
const getTemplateForReport = (report: Report): ReportTemplate | null => {
  if (report.report_type === 'combined' && report.included_tests) {
    return buildCombinedTemplate(report.included_tests);
  }
  return reportTemplates[report.report_type] || null;
};

// Get report data (handles combined reports)
const getReportData = (report: Report): Record<string, unknown> => {
  const rawData = report.report_data as Record<string, unknown>;
  if (report.report_type === 'combined' && report.included_tests) {
    return flattenCombinedReportData(rawData, report.included_tests);
  }
  return rawData;
};

// Get value status (normal, abnormal, unknown)
const getValueStatus = (
  value: number | string | null | undefined,
  field: TestField,
  gender: Gender
): 'normal' | 'abnormal' | 'unknown' => {
  if (value === null || value === undefined || value === '') return 'unknown';
  if (typeof value !== 'number') return 'unknown';
  if (!field.normalRange) return 'unknown';

  let min: number | undefined, max: number | undefined;
  if (field.normalRange.male && field.normalRange.female) {
    const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
    min = genderRange.min;
    max = genderRange.max;
  } else {
    min = field.normalRange.min;
    max = field.normalRange.max;
  }

  if (min !== undefined && value < min) return 'abnormal';
  if (max !== undefined && value > max) return 'abnormal';
  return 'normal';
};

// Format normal range for display
const formatNormalRange = (field: TestField, gender: Gender): string => {
  if (!field.normalRange) return '-';
  let min: number | undefined;
  let max: number | undefined;

  if (field.normalRange.male && field.normalRange.female) {
    const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
    min = genderRange.min;
    max = genderRange.max;
  } else {
    min = field.normalRange.min;
    max = field.normalRange.max;
  }

  if (min !== undefined && max !== undefined) return `${min} - ${max}`;
  if (min !== undefined) return `> ${min}`;
  if (max !== undefined) return `< ${max}`;
  return '-';
};

// Calculate trend based on first and last values
const calculateOverallTrend = (
  firstValue: number | string | null,
  lastValue: number | string | null,
  field: TestField,
  gender: Gender
): TrendType => {
  // Handle text-based fields
  if (typeof firstValue === 'string' || typeof lastValue === 'string') {
    if (firstValue === lastValue) return 'unchanged';
    if (firstValue === null || firstValue === undefined || firstValue === '') return 'new';
    if (lastValue === null || lastValue === undefined || lastValue === '') return 'removed';
    return 'unchanged';
  }

  // Handle null/undefined values
  if ((firstValue === null || firstValue === undefined) && (lastValue !== null && lastValue !== undefined)) return 'new';
  if ((lastValue === null || lastValue === undefined) && (firstValue !== null && firstValue !== undefined)) return 'removed';
  if (firstValue === null || lastValue === null || firstValue === undefined || lastValue === undefined) return 'unchanged';

  const numFirst = Number(firstValue);
  const numLast = Number(lastValue);
  
  if (numFirst === 0) {
    return numLast === 0 ? 'stable' : 'new';
  }

  const percentChange = ((numLast - numFirst) / Math.abs(numFirst)) * 100;

  // Stable if change is less than 5%
  if (Math.abs(percentChange) < 5) return 'stable';

  // Determine if moving toward or away from normal range
  if (!field.normalRange) {
    return percentChange > 0 ? 'improved' : 'declined';
  }

  let min: number | undefined, max: number | undefined;
  if (field.normalRange.male && field.normalRange.female) {
    const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
    min = genderRange.min;
    max = genderRange.max;
  } else {
    min = field.normalRange.min;
    max = field.normalRange.max;
  }

  // Calculate midpoint of normal range
  const midpoint = ((min || 0) + (max || 0)) / 2;
  const wasCloser = Math.abs(numFirst - midpoint);
  const isCloser = Math.abs(numLast - midpoint);

  return isCloser < wasCloser ? 'improved' : 'declined';
};

export function useMultiReportComparison(
  reports: Report[],
  patientGender: Gender = 'other'
): UseMultiReportComparisonResult {
  return useMemo(() => {
    if (reports.length < 2) {
      return {
        comparison: [],
        commonFields: [],
        fieldAvailability: new Map(),
        reportDates: [],
        uniqueFields: new Map(),
      };
    }

    // Sort reports by date (oldest first)
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
    );

    const reportDates = sortedReports.map(r => r.test_date);

    // Get templates and data for all reports
    const templates = sortedReports.map(r => getTemplateForReport(r));
    const dataArrays = sortedReports.map(r => getReportData(r));

    // Build field maps from templates
    const fieldMaps: Map<string, { field: TestField; category: string }>[] = templates.map((template) => {
      const map = new Map<string, { field: TestField; category: string }>();
      if (template) {
        template.categories.forEach((cat) => {
          cat.fields.forEach((field) => {
            map.set(field.name, { field, category: cat.name });
          });
        });
      }
      return map;
    });

    // Find all unique field names across all reports
    const allFieldNames = new Set<string>();
    fieldMaps.forEach(map => {
      map.forEach((_, name) => allFieldNames.add(name));
    });

    // Track field availability per report
    const fieldAvailability = new Map<string, boolean[]>();
    const commonFields: string[] = [];
    const uniqueFields = new Map<string, number[]>();

    allFieldNames.forEach((name) => {
      const availability = fieldMaps.map(map => map.has(name));
      fieldAvailability.set(name, availability);
      
      const presentCount = availability.filter(Boolean).length;
      if (presentCount === sortedReports.length) {
        commonFields.push(name);
      } else if (presentCount > 0) {
        const indices = availability
          .map((present, idx) => (present ? idx : -1))
          .filter(idx => idx !== -1);
        uniqueFields.set(name, indices);
      }
    });

    // Build comparison results for common fields
    const comparison: MultiComparisonResult[] = commonFields.map((fieldName) => {
      // Find the first available field info
      const fieldInfo = fieldMaps.find(map => map.has(fieldName))?.get(fieldName);
      if (!fieldInfo) {
        return null;
      }

      const { field, category } = fieldInfo;

      // Get values from all reports
      const values: (number | string | null)[] = dataArrays.map(data => 
        (data[fieldName] as number | string | null) ?? null
      );

      // Get statuses for all values
      const statuses: ('normal' | 'abnormal' | 'unknown')[] = values.map(value =>
        getValueStatus(value, field, patientGender)
      );

      // Find first and last non-null values
      const firstValue = values.find(v => v !== null && v !== undefined) ?? null;
      const lastValue = [...values].reverse().find(v => v !== null && v !== undefined) ?? null;

      // Calculate overall trend (first to last)
      const overallTrend = calculateOverallTrend(firstValue, lastValue, field, patientGender);

      // Calculate percent change
      let percentChangeOverall: number | null = null;
      if (typeof firstValue === 'number' && typeof lastValue === 'number' && firstValue !== 0) {
        percentChangeOverall = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
      }

      return {
        fieldName,
        fieldLabel: field.label,
        unit: field.unit || '',
        values,
        statuses,
        overallTrend,
        normalRange: formatNormalRange(field, patientGender),
        category,
        firstValue,
        lastValue,
        percentChangeOverall,
      };
    }).filter(Boolean) as MultiComparisonResult[];

    // Sort by category for grouped display
    comparison.sort((a, b) => a.category.localeCompare(b.category));

    return {
      comparison,
      commonFields,
      fieldAvailability,
      reportDates,
      uniqueFields,
    };
  }, [reports, patientGender]);
}
