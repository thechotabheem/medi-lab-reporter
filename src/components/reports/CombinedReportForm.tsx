import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DynamicReportForm } from './DynamicReportForm';
import { reportTemplates, getReportTypeName } from '@/lib/report-templates';
import type { ReportType, Patient } from '@/types/database';
import { Layers } from 'lucide-react';

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

  // Count total fields across all selected tests
  const totalFields = useMemo(() => {
    return selectedTests.reduce((total, type) => {
      const template = reportTemplates[type];
      if (!template) return total;
      return total + template.categories.reduce((catTotal, cat) => catTotal + cat.fields.length, 0);
    }, 0);
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
              <Badge variant="outline">{totalFields} total fields</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Test Forms */}
      <Accordion type="multiple" defaultValue={selectedTests} className="space-y-4">
        {selectedTests.map((testType) => {
          const template = reportTemplates[testType];
          if (!template) return null;

          const testFieldCount = template.categories.reduce((total, cat) => total + cat.fields.length, 0);

          return (
            <AccordionItem 
              key={testType} 
              value={testType} 
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{getReportTypeName(testType)}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {testFieldCount} fields
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <DynamicReportForm
                  reportType={testType}
                  patient={patient}
                  onChange={(data) => handleTestDataChange(testType, data)}
                  initialData={initialData[testType] || {}}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
