import { useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomizedTemplate } from '@/hooks/useCustomTemplates';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { usePatientHistory, getHistoricalComparison, getTrendIcon } from '@/hooks/usePatientHistory';
import type { ReportType, Patient, TestField, TestCategory } from '@/types/database';
import { Calculator, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { MEDICAL_HARD_LIMITS } from '@/lib/validation-schemas';

interface DynamicReportFormProps {
  reportType: ReportType;
  patient: Patient;
  onChange: (data: Record<string, string | number | boolean | null>) => void;
  initialData?: Record<string, string | number | boolean | null>;
}

export const DynamicReportForm = ({
  reportType,
  patient,
  onChange,
  initialData = {},
}: DynamicReportFormProps) => {
  const { template, isLoading } = useCustomizedTemplate(reportType);
  const formRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isCalculatingRef = useRef(false);
  const prevSerializedRef = useRef<string>('');

  const { control, watch, setValue, getValues } = useForm({
    defaultValues: initialData,
  });

  useKeyboardNavigation({
    containerRef: formRef,
    enabled: true,
  });

  const { data: patientHistory } = usePatientHistory({
    patientId: patient.id,
    reportType,
    limit: 3,
  });

  const formValues = watch();

  const historicalComparison = patientHistory?.length 
    ? getHistoricalComparison(formValues, patientHistory)
    : {};


  // Notify parent — debounced via serialization comparison to prevent infinite loops
  useEffect(() => {
    const serialized = JSON.stringify(formValues);
    if (serialized !== prevSerializedRef.current) {
      prevSerializedRef.current = serialized;
      onChangeRef.current(formValues);
    }
  }, [formValues]);

  const getNormalRangeStatus = useCallback((field: TestField, value: unknown): 'normal' | 'abnormal' | 'unknown' => {
    if (!field.normalRange || value === undefined || value === '' || value === null) {
      return 'unknown';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return 'unknown';

    const range = field.normalRange.male || field.normalRange.female
      ? (patient.gender === 'male' ? field.normalRange.male : field.normalRange.female)
      : field.normalRange;

    if (!range) return 'unknown';

    const min = range.min ?? -Infinity;
    const max = range.max ?? Infinity;

    return numValue >= min && numValue <= max ? 'normal' : 'abnormal';
  }, [patient.gender]);

  const formatNormalRange = useCallback((field: TestField): string => {
    if (!field.normalRange) return '';

    const range = field.normalRange.male || field.normalRange.female
      ? (patient.gender === 'male' ? field.normalRange.male : field.normalRange.female)
      : field.normalRange;

    if (!range) return '';

    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} - ${range.max}`;
    }
    if (range.min !== undefined) {
      return `> ${range.min}`;
    }
    if (range.max !== undefined) {
      return `< ${range.max}`;
    }
    return '';
  }, [patient.gender]);

  // Check if field is qualitative (no numeric range/unit)
  const isQualitativeField = useCallback((field: TestField): boolean => {
    return field.type === 'select' || (field.type === 'text' && !field.unit && !field.normalRange);
  }, []);

  const renderField = (field: TestField, category: TestCategory) => {
    const qualitative = isQualitativeField(field);
    const status = qualitative ? 'unknown' : getNormalRangeStatus(field, formValues[field.name]);
    const comparison = historicalComparison[field.name];
    const hasTrend = comparison && comparison.trend !== 'unknown';

    const hardLimit = MEDICAL_HARD_LIMITS[field.name];
    const currentValue = formValues[field.name];
    const numValue = currentValue !== undefined && currentValue !== '' ? Number(currentValue) : null;
    const exceedsHardLimit = hardLimit && numValue !== null && !isNaN(numValue) && (numValue < hardLimit.min || numValue > hardLimit.max);

    const TrendIcon = comparison?.trend === 'up' ? TrendingUp 
      : comparison?.trend === 'down' ? TrendingDown 
      : comparison?.trend === 'stable' ? Minus 
      : null;

    // Qualitative fields: simplified 2-column layout (Test Name | Status)
    if (qualitative) {
      return (
        <div key={field.name} className="flex items-center justify-between gap-4 py-3 border-b last:border-0 md:grid md:grid-cols-2 md:gap-4 md:py-2">
          <div>
            <Label className="text-sm font-medium">{field.label}</Label>
          </div>
          <div>
            <Controller
              name={field.name}
              control={control}
              render={({ field: formField }) => {
                if (field.type === 'select' && field.options) {
                  return (
                    <Select
                      value={formField.value as string}
                      onValueChange={formField.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }
                return (
                  <Input
                    {...formField}
                    type="text"
                    value={(formField.value as string) || ''}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                );
              }}
            />
          </div>
        </div>
      );
    }

    // Quantitative fields: full layout
    return (
      <div key={field.name} className="flex flex-col gap-2 py-3 border-b last:border-0 md:grid md:grid-cols-12 md:gap-4 md:items-center md:py-2">
        {/* Test Label */}
        <div className="md:col-span-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            {field.label}
            {field.calculated && (
              <Badge variant="secondary" className="text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
            {hasTrend && TrendIcon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center gap-1 text-xs ${
                    comparison.trend === 'up' ? 'text-amber-500' :
                    comparison.trend === 'down' ? 'text-blue-500' :
                    'text-muted-foreground'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {comparison.percentChange !== null && `${comparison.percentChange > 0 ? '+' : ''}${comparison.percentChange}%`}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Previous: {comparison.previousValue ?? 'N/A'}
                    {comparison.previousDate && ` (${comparison.previousDate})`}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </Label>
        </div>

        {/* Result Input */}
        <div className="md:col-span-4">
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => {
              if (field.type === 'textarea') {
                return (
                  <Textarea
                    {...formField}
                    value={(formField.value as string) || ''}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    rows={2}
                  />
                );
              }

              return (
                <div className="relative">
                  <Input
                    {...formField}
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={(formField.value as string | number) ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // For number fields, store as number when valid, empty string when blank
                      if (field.type === 'number') {
                        if (val === '' || val === '-') {
                          formField.onChange(val);
                        } else {
                          const num = parseFloat(val);
                          formField.onChange(isNaN(num) ? val : num);
                        }
                      } else {
                        formField.onChange(val);
                      }
                    }}
                    placeholder={field.type === 'number' ? '' : `Enter ${field.label.toLowerCase()}`}
                    disabled={field.calculated}
                    className={cn(
                      status === 'abnormal' && 'border-destructive',
                      exceedsHardLimit && 'border-warning bg-warning/5'
                    )}
                  />
                  {field.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {field.unit}
                    </span>
                  )}
                  {exceedsHardLimit && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Value outside physiological range ({hardLimit.min}–{hardLimit.max})</span>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Normal Range & Status */}
        <div className="flex items-center justify-between gap-2 md:col-span-4 md:contents">
          <span className="text-xs text-muted-foreground md:col-span-3 md:text-sm">
            {formatNormalRange(field)}
            {field.unit && ` ${field.unit}`}
          </span>

          <div className="flex items-center gap-1 md:col-span-1 md:justify-center">
            {status === 'normal' && (
              <CheckCircle className="h-4 w-4 text-green-500 md:h-5 md:w-5" />
            )}
            {status === 'abnormal' && (
              <AlertCircle className="h-4 w-4 text-destructive md:h-5 md:w-5" />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || !template) {
    return (
      <div className="space-y-4">
        <Card className="border rounded-lg p-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={formRef} className="space-y-4">
      <Accordion type="multiple" defaultValue={template.categories.map((c) => c.name)} className="space-y-4">
        {template.categories.map((category) => {
          const hasQuantitative = category.fields.some(f => !isQualitativeField(f));
          
          return (
            <AccordionItem key={category.name} value={category.name} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.fields.length} fields
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-none">
                  {/* Table header - only for quantitative fields */}
                  {hasQuantitative && (
                    <CardHeader className="hidden md:block px-0 py-2">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-4">Test</div>
                        <div className="col-span-4">Result</div>
                        <div className="col-span-3">Normal Range</div>
                        <div className="col-span-1 text-center">Status</div>
                      </div>
                    </CardHeader>
                  )}
                  <CardContent className="px-0">
                    {category.fields.map((field) => renderField(field, category))}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
