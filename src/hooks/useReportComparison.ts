import { useMemo } from 'react';
import type { Report, Gender, TestField, ReportTemplate } from '@/types/database';
import { reportTemplates, buildCombinedTemplate, flattenCombinedReportData } from '@/lib/report-templates';

export type TrendType = 'improved' | 'declined' | 'stable' | 'new' | 'removed' | 'unchanged';

export interface ComparisonResult {
  fieldName: string;
  fieldLabel: string;
  unit: string;
  valueA: number | string | null;
  valueB: number | string | null;
  absoluteChange: number | null;
  percentChange: number | null;
  trend: TrendType;
  normalRange: string;
  statusA: 'normal' | 'abnormal' | 'unknown';
  statusB: 'normal' | 'abnormal' | 'unknown';
  category: string;
}

interface UseReportComparisonResult {
  comparison: ComparisonResult[];
  commonFields: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  templateA: ReportTemplate | null;
  templateB: ReportTemplate | null;
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

// Calculate trend based on values and normal range
const calculateTrend = (
  valueA: number | string | null,
  valueB: number | string | null,
  field: TestField,
  gender: Gender
): TrendType => {
  // Handle text-based fields
  if (typeof valueA === 'string' || typeof valueB === 'string') {
    if (valueA === valueB) return 'unchanged';
    if (valueA === null || valueA === undefined || valueA === '') return 'new';
    if (valueB === null || valueB === undefined || valueB === '') return 'removed';
    return 'unchanged'; // Text changed, but no trend direction
  }

  // Handle null/undefined values
  if ((valueA === null || valueA === undefined) && (valueB !== null && valueB !== undefined)) return 'new';
  if ((valueB === null || valueB === undefined) && (valueA !== null && valueA !== undefined)) return 'removed';
  if (valueA === null || valueB === null || valueA === undefined || valueB === undefined) return 'unchanged';

  // Calculate percentage change
  const numA = Number(valueA);
  const numB = Number(valueB);
  
  if (numA === 0) {
    return numB === 0 ? 'stable' : 'new';
  }

  const percentChange = ((numB - numA) / Math.abs(numA)) * 100;

  // Stable if change is less than 5%
  if (Math.abs(percentChange) < 5) return 'stable';

  // Determine if moving toward or away from normal range
  if (!field.normalRange) {
    // No normal range defined, just show direction
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
  const wasCloser = Math.abs(numA - midpoint);
  const isCloser = Math.abs(numB - midpoint);

  return isCloser < wasCloser ? 'improved' : 'declined';
};

export function useReportComparison(
  reportA: Report | null,
  reportB: Report | null,
  patientGender: Gender = 'other'
): UseReportComparisonResult {
  return useMemo(() => {
    if (!reportA || !reportB) {
      return {
        comparison: [],
        commonFields: [],
        uniqueToA: [],
        uniqueToB: [],
        templateA: null,
        templateB: null,
      };
    }

    const templateA = getTemplateForReport(reportA);
    const templateB = getTemplateForReport(reportB);

    if (!templateA || !templateB) {
      return {
        comparison: [],
        commonFields: [],
        uniqueToA: [],
        uniqueToB: [],
        templateA,
        templateB,
      };
    }

    const dataA = getReportData(reportA);
    const dataB = getReportData(reportB);

    // Build field maps from templates
    const fieldsA = new Map<string, { field: TestField; category: string }>();
    const fieldsB = new Map<string, { field: TestField; category: string }>();

    templateA.categories.forEach((cat) => {
      cat.fields.forEach((field) => {
        fieldsA.set(field.name, { field, category: cat.name });
      });
    });

    templateB.categories.forEach((cat) => {
      cat.fields.forEach((field) => {
        fieldsB.set(field.name, { field, category: cat.name });
      });
    });

    // Find common and unique fields
    const allFieldNames = new Set([...fieldsA.keys(), ...fieldsB.keys()]);
    const commonFields: string[] = [];
    const uniqueToA: string[] = [];
    const uniqueToB: string[] = [];

    allFieldNames.forEach((name) => {
      const inA = fieldsA.has(name);
      const inB = fieldsB.has(name);
      if (inA && inB) {
        commonFields.push(name);
      } else if (inA) {
        uniqueToA.push(name);
      } else {
        uniqueToB.push(name);
      }
    });

    // Build comparison results for common fields
    const comparison: ComparisonResult[] = commonFields.map((fieldName) => {
      const fieldInfoA = fieldsA.get(fieldName)!;
      const field = fieldInfoA.field;

      const valueA = dataA[fieldName] as number | string | null;
      const valueB = dataB[fieldName] as number | string | null;

      const statusA = getValueStatus(valueA, field, patientGender);
      const statusB = getValueStatus(valueB, field, patientGender);

      let absoluteChange: number | null = null;
      let percentChange: number | null = null;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        absoluteChange = valueB - valueA;
        if (valueA !== 0) {
          percentChange = ((valueB - valueA) / Math.abs(valueA)) * 100;
        }
      }

      const trend = calculateTrend(valueA, valueB, field, patientGender);

      return {
        fieldName,
        fieldLabel: field.label,
        unit: field.unit || '',
        valueA,
        valueB,
        absoluteChange,
        percentChange,
        trend,
        normalRange: formatNormalRange(field, patientGender),
        statusA,
        statusB,
        category: fieldInfoA.category,
      };
    });

    // Sort by category for grouped display
    comparison.sort((a, b) => a.category.localeCompare(b.category));

    return {
      comparison,
      commonFields,
      uniqueToA,
      uniqueToB,
      templateA,
      templateB,
    };
  }, [reportA, reportB, patientGender]);
}