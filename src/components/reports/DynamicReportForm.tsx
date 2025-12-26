import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getReportTemplate } from '@/lib/report-templates';
import type { ReportType, Patient, TestField, TestCategory } from '@/types/database';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';

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
  const { control, watch, setValue, getValues } = useForm({
    defaultValues: initialData,
  });

  const formValues = watch();

  // Auto-calculations
  const calculateField = useCallback((field: TestField, values: Record<string, unknown>) => {
    if (!field.calculated || !field.formula) return null;

    try {
      if (field.name === 'vldl' && values.triglycerides) {
        return Number(values.triglycerides) / 5;
      }
      if (field.name === 'indirect_bilirubin' && values.total_bilirubin && values.direct_bilirubin) {
        return Number(values.total_bilirubin) - Number(values.direct_bilirubin);
      }
      if (field.name === 'globulin' && values.total_protein && values.albumin) {
        return Number(values.total_protein) - Number(values.albumin);
      }
      if (field.name === 'homa_ir' && values.insulin_fasting && values.fasting_glucose) {
        return (Number(values.insulin_fasting) * Number(values.fasting_glucose)) / 405;
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

    return (
      <div key={field.name} className="grid grid-cols-12 gap-4 items-center py-2 border-b last:border-0">
        <div className="col-span-4">
          <Label className="flex items-center gap-2">
            {field.label}
            {field.calculated && (
              <Badge variant="secondary" className="text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </Label>
        </div>

        <div className="col-span-4">
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

        <div className="col-span-3 text-sm text-muted-foreground">
          {formatNormalRange(field)}
          {field.unit && ` ${field.unit}`}
        </div>

        <div className="col-span-1 flex justify-center">
          {status === 'normal' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {status === 'abnormal' && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
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
                <CardHeader className="px-0 py-2">
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
