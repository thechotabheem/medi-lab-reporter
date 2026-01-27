import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { reportTemplates } from '@/lib/report-templates';
import { applyCustomizations, type TemplateCustomization } from '@/hooks/useCustomTemplates';
import type { ReportType, TestField } from '@/types/database';

interface TemplatePreviewDialogProps {
  reportType: ReportType;
  customizations: TemplateCustomization;
}

export const TemplatePreviewDialog = ({
  reportType,
  customizations,
}: TemplatePreviewDialogProps) => {
  const previewTemplate = useMemo(() => {
    const baseTemplate = reportTemplates[reportType];
    return applyCustomizations(baseTemplate, customizations);
  }, [reportType, customizations]);

  // Sample data for preview - generates random-ish values for demonstration
  const sampleData = useMemo(() => {
    const data: Record<string, number | string> = {};
    previewTemplate.categories.forEach(category => {
      category.fields.forEach(field => {
        if (field.type === 'number' && field.normalRange) {
          const min = field.normalRange.min ?? 0;
          const max = field.normalRange.max ?? 100;
          // Generate a value that's sometimes normal, sometimes abnormal
          const isAbnormal = Math.random() > 0.7;
          if (isAbnormal) {
            data[field.name] = Math.random() > 0.5 
              ? (max + (max - min) * 0.2).toFixed(2)
              : (min - (max - min) * 0.2).toFixed(2);
          } else {
            data[field.name] = (min + Math.random() * (max - min)).toFixed(2);
          }
        } else if (field.type === 'select' && field.options?.length) {
          data[field.name] = field.options[0];
        } else if (field.type === 'text') {
          data[field.name] = 'Sample Value';
        }
      });
    });
    return data;
  }, [previewTemplate]);

  const getNormalRangeStatus = (field: TestField, value: unknown): 'normal' | 'abnormal' | 'unknown' => {
    if (!field.normalRange || value === undefined || value === '' || value === null) {
      return 'unknown';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return 'unknown';

    const range = field.normalRange;
    const min = range.min ?? -Infinity;
    const max = range.max ?? Infinity;

    return numValue >= min && numValue <= max ? 'normal' : 'abnormal';
  };

  const formatNormalRange = (field: TestField): string => {
    if (!field.normalRange) return '';
    const range = field.normalRange;

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Template Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your customized template will appear in a report
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Report Header Preview */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{previewTemplate.name}</h2>
                  <Badge variant="secondary">Preview Mode</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sample patient data shown for demonstration
                </p>
              </CardHeader>
            </Card>

            {/* Categories */}
            <Accordion 
              type="multiple" 
              defaultValue={previewTemplate.categories.map(c => c.name)}
              className="space-y-4"
            >
              {previewTemplate.categories.map((category) => (
                <AccordionItem 
                  key={category.name} 
                  value={category.name} 
                  className="border rounded-lg px-4"
                >
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
                      {/* Table header */}
                      <CardHeader className="hidden md:block px-0 py-2">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                          <div className="col-span-4">Test</div>
                          <div className="col-span-4">Result</div>
                          <div className="col-span-3">Normal Range</div>
                          <div className="col-span-1 text-center">Status</div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-0">
                        {category.fields.map((field) => {
                          const value = sampleData[field.name];
                          const status = getNormalRangeStatus(field, value);
                          
                          return (
                            <div 
                              key={field.name} 
                              className="flex flex-col gap-2 py-3 border-b last:border-0 md:grid md:grid-cols-12 md:gap-4 md:items-center md:py-2"
                            >
                              {/* Test Label */}
                              <div className="md:col-span-4">
                                <span className="text-sm font-medium">{field.label}</span>
                              </div>

                              {/* Result */}
                              <div className="md:col-span-4">
                                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted text-sm ${
                                  status === 'abnormal' ? 'text-destructive font-semibold' : ''
                                }`}>
                                  {value ?? '-'}
                                  {field.unit && (
                                    <span className="text-muted-foreground ml-1">{field.unit}</span>
                                  )}
                                </div>
                              </div>

                              {/* Normal Range */}
                              <div className="flex items-center justify-between gap-2 md:col-span-4 md:contents">
                                <span className="text-xs text-muted-foreground md:col-span-3 md:text-sm">
                                  {formatNormalRange(field)}
                                  {field.unit && ` ${field.unit}`}
                                </span>

                                {/* Status */}
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
                        })}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Categories: {previewTemplate.categories.length}
                  </span>
                  <span className="text-muted-foreground">
                    Total Fields: {previewTemplate.categories.reduce((sum, c) => sum + c.fields.length, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
