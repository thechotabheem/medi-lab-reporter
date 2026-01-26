import { useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getReportTemplate } from '@/lib/report-templates';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { usePatientHistory, getHistoricalComparison, getTrendIcon } from '@/hooks/usePatientHistory';
import type { ReportType, Patient, TestField, TestCategory } from '@/types/database';
import { Calculator, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  const template = getReportTemplate(reportType);
  const formRef = useRef<HTMLDivElement>(null);
  const { control, watch, setValue, getValues } = useForm({
    defaultValues: initialData,
  });

  // Keyboard navigation setup
  useKeyboardNavigation({
    containerRef: formRef,
    enabled: true,
  });

  // Fetch patient history for trend comparison
  const { data: patientHistory } = usePatientHistory({
    patientId: patient.id,
    reportType,
    limit: 3,
  });

  const formValues = watch();

  // Historical comparison data
  const historicalComparison = patientHistory?.length 
    ? getHistoricalComparison(formValues, patientHistory)
    : {};

  // Auto-calculations - extended with more formulas
  const calculateField = useCallback((field: TestField, values: Record<string, unknown>) => {
    if (!field.calculated || !field.formula) return null;

    try {
      // VLDL = Triglycerides / 5
      if (field.name === 'vldl' && values.triglycerides) {
        return Number(values.triglycerides) / 5;
      }
      // Indirect Bilirubin = Total - Direct
      if (field.name === 'indirect_bilirubin' && values.total_bilirubin && values.direct_bilirubin) {
        return Number(values.total_bilirubin) - Number(values.direct_bilirubin);
      }
      // Globulin = Total Protein - Albumin
      if (field.name === 'globulin' && values.total_protein && values.albumin) {
        return Number(values.total_protein) - Number(values.albumin);
      }
      // HOMA-IR = (Insulin * Glucose) / 405
      if (field.name === 'homa_ir' && values.insulin_fasting && values.fasting_glucose) {
        return (Number(values.insulin_fasting) * Number(values.fasting_glucose)) / 405;
      }
      // A/G Ratio = Albumin / Globulin
      if (field.name === 'ag_ratio' && values.albumin && values.globulin) {
        const globulin = Number(values.globulin);
        return globulin > 0 ? Number(values.albumin) / globulin : null;
      }
      // LDL (Friedewald) = TC - HDL - (TG/5)
      if (field.name === 'ldl' && values.total_cholesterol && values.hdl && values.triglycerides) {
        const tg = Number(values.triglycerides);
        // Friedewald formula is not accurate if TG > 400
        if (tg <= 400) {
          return Number(values.total_cholesterol) - Number(values.hdl) - (tg / 5);
        }
      }
      // TC/HDL Ratio
      if (field.name === 'tc_hdl_ratio' && values.total_cholesterol && values.hdl) {
        const hdl = Number(values.hdl);
        return hdl > 0 ? Number(values.total_cholesterol) / hdl : null;
      }
      // LDL/HDL Ratio
      if (field.name === 'ldl_hdl_ratio' && values.ldl && values.hdl) {
        const hdl = Number(values.hdl);
        return hdl > 0 ? Number(values.ldl) / hdl : null;
      }
      // BUN from Urea
      if (field.name === 'bun' && values.urea) {
        return Number(values.urea) * 0.467;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  // Run auto-calculations when form values change
  useEffect(() => {
    template.categories.forEach((category) => {
      category.fields.forEach((field) => {
        if (field.calculated) {
          const calculatedValue = calculateField(field, formValues);
          if (calculatedValue !== null) {
            const currentValue = getValues(field.name);
            const roundedValue = Math.round(calculatedValue * 100) / 100;
            if (currentValue !== roundedValue) {
              setValue(field.name, roundedValue);
            }
          }
        }
      });
    });
  }, [formValues, template.categories, calculateField, setValue, getValues]);

  // Notify parent of changes
  useEffect(() => {
    onChange(formValues);
  }, [formValues, onChange]);

  const getNormalRangeStatus = (field: TestField, value: unknown): 'normal' | 'abnormal' | 'unknown' => {
    if (!field.normalRange || value === undefined || value === '' || value === null) {
      return 'unknown';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return 'unknown';

    // Check gender-specific ranges
    const range = field.normalRange.male || field.normalRange.female
      ? (patient.gender === 'male' ? field.normalRange.male : field.normalRange.female)
      : field.normalRange;

    if (!range) return 'unknown';

    const min = range.min ?? -Infinity;
    const max = range.max ?? Infinity;

    return numValue >= min && numValue <= max ? 'normal' : 'abnormal';
  };

  const formatNormalRange = (field: TestField): string => {
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
  };

  const renderField = (field: TestField, category: TestCategory) => {
    const status = getNormalRangeStatus(field, formValues[field.name]);
    const comparison = historicalComparison[field.name];
    const hasTrend = comparison && comparison.trend !== 'unknown';

    // Get trend icon component
    const TrendIcon = comparison?.trend === 'up' ? TrendingUp 
      : comparison?.trend === 'down' ? TrendingDown 
      : comparison?.trend === 'stable' ? Minus 
      : null;
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
              if (field.type === 'select' && field.options) {
                return (
                  <Select
                    value={formField.value as string}
                    onValueChange={formField.onChange}
                    disabled={field.calculated}
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
                    placeholder={field.type === 'number' ? '0.00' : `Enter ${field.label.toLowerCase()}`}
                    disabled={field.calculated}
                    className={status === 'abnormal' ? 'border-destructive' : ''}
                  />
                  {field.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {field.unit}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Normal Range & Status - stacked on mobile, inline on desktop */}
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

  return (
    <div ref={formRef} className="space-y-4">
      <Accordion type="multiple" defaultValue={template.categories.map((c) => c.name)} className="space-y-4">
        {template.categories.map((category) => (
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
                {/* Table header - hidden on mobile */}
                <CardHeader className="hidden md:block px-0 py-2">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Test</div>
                    <div className="col-span-4">Result</div>
                    <div className="col-span-3">Normal Range</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  {category.fields.map((field) => renderField(field, category))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
