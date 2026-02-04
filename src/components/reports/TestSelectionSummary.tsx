import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Clock, List, Zap } from 'lucide-react';
import { reportTemplates, getReportTypeName } from '@/lib/report-templates';
import { useFullyCustomTemplates } from '@/hooks/useCustomTemplates';
import type { ReportType } from '@/types/database';
import type { QuickCustomTestData } from './QuickCustomTestDialog';

interface TestSelectionSummaryProps {
  selectedTests: ReportType[];
  customTests?: QuickCustomTestData[];
}

// Estimated seconds per field to fill in
const SECONDS_PER_FIELD = 8;

export const TestSelectionSummary = ({ selectedTests, customTests = [] }: TestSelectionSummaryProps) => {
  const { data: fullyCustomTemplates } = useFullyCustomTemplates();

  const stats = useMemo(() => {
    let totalFields = 0;
    const testDetails: { name: string; fields: number; isCustom?: boolean }[] = [];

    selectedTests.forEach((type) => {
      // Check if it's a custom template code
      const customTemplate = fullyCustomTemplates?.find(t => t.code === type);
      if (customTemplate) {
        const fieldCount = customTemplate.categories.reduce(
          (total, cat) => total + cat.fields.length, 
          0
        );
        totalFields += fieldCount;
        testDetails.push({
          name: customTemplate.name,
          fields: fieldCount,
          isCustom: true,
        });
        return;
      }

      // Check if it's a quick custom test
      const quickTest = customTests.find(t => t.code === type);
      if (quickTest) {
        const fieldCount = quickTest.categories.reduce(
          (total, cat) => total + cat.fields.length, 
          0
        );
        totalFields += fieldCount;
        testDetails.push({
          name: quickTest.name,
          fields: fieldCount,
          isCustom: true,
        });
        return;
      }

      // Built-in template
      const template = reportTemplates[type];
      if (!template) return;
      
      const fieldCount = template.categories.reduce(
        (total, cat) => total + cat.fields.length, 
        0
      );
      totalFields += fieldCount;
      testDetails.push({
        name: getReportTypeName(type),
        fields: fieldCount,
      });
    });

    // Calculate estimated time
    const totalSeconds = totalFields * SECONDS_PER_FIELD;
    const minutes = Math.ceil(totalSeconds / 60);
    const timeEstimate = minutes < 1 ? '< 1 min' : `~${minutes} min`;

    return { totalFields, testDetails, timeEstimate };
  }, [selectedTests, customTests, fullyCustomTemplates]);

  if (selectedTests.length === 0 && customTests.length === 0) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left side - icon and title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {selectedTests.length === 1 
                  ? stats.testDetails[0]?.name 
                  : `Combined Report (${selectedTests.length} tests)`}
              </p>
              {selectedTests.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {stats.testDetails.map(t => t.name).join(' + ')}
                </p>
              )}
            </div>
          </div>

          {/* Right side - stats */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <List className="h-3 w-3" />
              <span>{stats.totalFields} fields</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{stats.timeEstimate}</span>
            </Badge>
          </div>
        </div>

        {/* Test breakdown for multiple tests */}
        {selectedTests.length > 1 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {stats.testDetails.map((test) => (
                <div 
                  key={test.name} 
                  className="flex items-center gap-2 text-xs bg-background/60 rounded-md px-2 py-1"
                >
                  {test.isCustom && <Zap className="h-3 w-3 text-primary" />}
                  <span className="font-medium">{test.name}</span>
                  <span className="text-muted-foreground">({test.fields} fields)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
