import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { DynamicReportForm } from './DynamicReportForm';
import { reportTemplates, getReportTypeName } from '@/lib/report-templates';
import { useCustomizedTemplate } from '@/hooks/useCustomTemplates';
import type { ReportType, Patient, ReportTemplate } from '@/types/database';
import { Layers, AlertCircle } from 'lucide-react';

interface TestSectionProps {
  testType: ReportType;
  patient: Patient;
  onChange: (data: Record<string, string | number | boolean | null>) => void;
  initialData: Record<string, string | number | boolean | null>;
}

// Individual test section that handles its own template loading
const TestSection = ({ testType, patient, onChange, initialData }: TestSectionProps) => {
  const { template, isLoading } = useCustomizedTemplate(testType);

  if (isLoading) {
    return (
      <AccordionItem value={testType} className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  if (!template) {
    return (
      <AccordionItem value={testType} className="border rounded-lg overflow-hidden border-destructive/50">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-destructive/5">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{getReportTypeName(testType)}</span>
            <Badge variant="destructive" className="text-xs">Template not found</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            This template could not be loaded. It may have been deleted or is unavailable.
          </p>
        </AccordionContent>
      </AccordionItem>
    );
  }

  const testFieldCount = template.categories.reduce((total, cat) => total + cat.fields.length, 0);

  return (
    <AccordionItem value={testType} className="border rounded-lg overflow-hidden">
      <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {testFieldCount} fields
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <DynamicReportForm
          reportType={testType}
          patient={patient}
          onChange={onChange}
          initialData={initialData}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

interface CombinedReportFormProps {
  selectedTests: ReportType[];
  patient: Patient;
  onChange: (data: Record<string, Record<string, string | number | boolean | null>>) => void;
  initialData?: Record<string, Record<string, string | number | boolean | null>>;
}

export const CombinedReportForm = ({
  selectedTests,
  patient,
  onChange,
  initialData = {},
}: CombinedReportFormProps) => {
  // Handle changes for a specific test type
  const handleTestDataChange = useCallback((testType: ReportType, data: Record<string, string | number | boolean | null>) => {
    onChange({
      ...initialData,
      [testType]: data,
    });
  }, [onChange, initialData]);

  // Count total fields across all selected tests (for built-in templates only, custom ones load async)
  const { totalFields, builtInCount } = useMemo(() => {
    let total = 0;
    let builtIn = 0;
    selectedTests.forEach(type => {
      const template = reportTemplates[type];
      if (template) {
        builtIn++;
        total += template.categories.reduce((catTotal, cat) => catTotal + cat.fields.length, 0);
      }
    });
    return { totalFields: total, builtInCount: builtIn };
  }, [selectedTests]);

  if (selectedTests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select at least one test type to enter results</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-medium">Combined Report</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedTests.length} tests</Badge>
              {builtInCount > 0 && (
                <Badge variant="outline">{totalFields}+ fields</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Test Forms */}
      <Accordion type="multiple" defaultValue={selectedTests} className="space-y-4">
        {selectedTests.map((testType) => (
          <TestSection
            key={testType}
            testType={testType}
            patient={patient}
            onChange={(data) => handleTestDataChange(testType, data)}
            initialData={initialData[testType] || {}}
          />
        ))}
      </Accordion>
    </div>
  );
};
