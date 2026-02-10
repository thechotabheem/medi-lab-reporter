import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Report, ReportType } from '@/types/database';

interface PatientHistoryOptions {
  patientId: string | null | undefined;
  reportType?: ReportType;
  limit?: number;
}

interface HistoricalValue {
  fieldName: string;
  currentValue: number | string | null;
  previousValue: number | string | null;
  previousDate: string | null;
  trend: 'up' | 'down' | 'stable' | 'unknown';
  percentChange: number | null;
}

// UUID v4 pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return UUID_REGEX.test(id);
};

export const usePatientHistory = ({ patientId, reportType, limit = 5 }: PatientHistoryOptions) => {
  // Only run query if patientId is a valid UUID (prevents 400 errors for "new" or invalid IDs)
  const hasValidPatientId = isValidUUID(patientId);

  return useQuery({
    queryKey: ['patient-history', patientId, reportType, limit],
    queryFn: async () => {
      if (!hasValidPatientId) return [];

      let query = supabase
        .from('reports')
        .select('id, report_type, report_data, test_date, created_at')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('test_date', { ascending: false })
        .limit(limit);
      // Only filter by report_type if it's a valid database enum value
      // Skip for custom templates as they use 'combined' report_type
      if (reportType && !reportType.startsWith('custom_') && !reportType.startsWith('quick_')) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Pick<Report, 'id' | 'report_type' | 'report_data' | 'test_date' | 'created_at'>[];
    },
    enabled: hasValidPatientId,
  });
};

export const getHistoricalComparison = (
  currentData: Record<string, unknown>,
  previousReports: Pick<Report, 'report_data' | 'test_date'>[]
): Record<string, HistoricalValue> => {
  const comparisons: Record<string, HistoricalValue> = {};

  if (!previousReports.length) return comparisons;

  const previousReport = previousReports[0];
  const previousData = previousReport.report_data as Record<string, unknown>;

  for (const [fieldName, currentValue] of Object.entries(currentData)) {
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      continue;
    }

    const previousValue = previousData[fieldName];
    
    // Only compare numeric values
    const currentNum = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue));
    const previousNum = typeof previousValue === 'number' ? previousValue : parseFloat(String(previousValue));

    let trend: 'up' | 'down' | 'stable' | 'unknown' = 'unknown';
    let percentChange: number | null = null;

    if (!isNaN(currentNum) && !isNaN(previousNum) && previousNum !== 0) {
      percentChange = ((currentNum - previousNum) / previousNum) * 100;
      
      if (Math.abs(percentChange) < 1) {
        trend = 'stable';
      } else if (currentNum > previousNum) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }

    comparisons[fieldName] = {
      fieldName,
      currentValue: currentValue as number | string | null,
      previousValue: previousValue as number | string | null ?? null,
      previousDate: previousReport.test_date,
      trend,
      percentChange: percentChange !== null ? Math.round(percentChange * 10) / 10 : null,
    };
  }

  return comparisons;
};

export const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'unknown'): string => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
    default:
      return '';
  }
};

export const getTrendColor = (
  trend: 'up' | 'down' | 'stable' | 'unknown',
  isHighBetter: boolean = false
): string => {
  if (trend === 'unknown' || trend === 'stable') {
    return 'text-muted-foreground';
  }
  
  // For most lab values, lower is often concerning (like hemoglobin)
  // But for some values, higher is concerning (like cholesterol)
  if (isHighBetter) {
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  }
  
  // Default: neutral display
  return trend === 'up' ? 'text-amber-500' : 'text-blue-500';
};
