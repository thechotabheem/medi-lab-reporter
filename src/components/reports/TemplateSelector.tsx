import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportTemplates } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';
import { Beaker, Droplets, ShieldCheck, Droplet } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (type: ReportType) => void;
  selectedType?: ReportType | null;
}

const templateIcons: Record<ReportType, React.ReactNode> = {
  blood_test: <Beaker className="h-8 w-8" />,
  urine_analysis: <Droplets className="h-8 w-8" />,
  screening_tests: <ShieldCheck className="h-8 w-8" />,
  blood_group_typing: <Droplet className="h-8 w-8" />,
};

const templateDescriptions: Record<ReportType, string> = {
  blood_test: 'CBC, LFT, RFT, Lipid Profile, ESR, Blood Sugar, Serum Calcium',
  urine_analysis: 'Physical, Chemical, and Microscopic Examination',
  screening_tests: 'MP, Typhoid, HCV, HBsAg, HIV, VDRL, H. Pylori',
  blood_group_typing: 'Blood Group (ABO & Rh) and R.A Factor',
};

export const TemplateSelector = ({ onSelect, selectedType }: TemplateSelectorProps) => {
  const templates = Object.entries(reportTemplates) as [ReportType, typeof reportTemplates.blood_test][];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {templates.map(([type, template]) => (
        <Card
          key={type}
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            selectedType === type ? 'border-primary bg-primary/5 shadow-md' : ''
          }`}
          onClick={() => onSelect(type)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {templateIcons[type]}
              </div>
              {selectedType === type && (
                <Badge variant="default">Selected</Badge>
              )}
            </div>
            <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
            <CardDescription>{templateDescriptions[type]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{template.categories.length}</span> test categories
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
