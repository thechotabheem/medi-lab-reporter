import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportTemplates } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';
import { 
  Beaker, 
  Droplets, 
  Heart, 
  Activity, 
  TestTube, 
  Droplet, 
  ShieldCheck, 
  Bug, 
  Syringe,
  FlaskConical,
  CircleDot
} from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (type: ReportType) => void;
  selectedType?: ReportType | null;
}

const templateIcons: Record<ReportType, React.ReactNode> = {
  // Legacy
  blood_test: <Beaker className="h-6 w-6" />,
  urine_analysis: <Droplets className="h-6 w-6" />,
  screening_tests: <ShieldCheck className="h-6 w-6" />,
  blood_group_typing: <Droplet className="h-6 w-6" />,
  // Value Based
  cbc: <Beaker className="h-6 w-6" />,
  lft: <FlaskConical className="h-6 w-6" />,
  rft: <TestTube className="h-6 w-6" />,
  lipid_profile: <Heart className="h-6 w-6" />,
  esr: <Activity className="h-6 w-6" />,
  bsr: <Droplets className="h-6 w-6" />,
  bsf: <Droplets className="h-6 w-6" />,
  serum_calcium: <CircleDot className="h-6 w-6" />,
  // Screening
  mp: <Bug className="h-6 w-6" />,
  typhoid: <ShieldCheck className="h-6 w-6" />,
  hcv: <Syringe className="h-6 w-6" />,
  hbsag: <Syringe className="h-6 w-6" />,
  hiv: <ShieldCheck className="h-6 w-6" />,
  vdrl: <TestTube className="h-6 w-6" />,
  h_pylori: <Bug className="h-6 w-6" />,
  // Blood Group & Typing
  blood_group: <Droplet className="h-6 w-6" />,
  ra_factor: <Activity className="h-6 w-6" />,
};

const categoryLabels: { label: string; types: ReportType[] }[] = [
  {
    label: 'Value Based Tests',
    types: ['cbc', 'lft', 'rft', 'lipid_profile', 'esr', 'bsr', 'bsf', 'serum_calcium']
  },
  {
    label: 'Screening Tests (Negative/Positive)',
    types: ['mp', 'typhoid', 'hcv', 'hbsag', 'hiv', 'vdrl', 'h_pylori']
  },
  {
    label: 'Blood Group & Typing',
    types: ['blood_group', 'ra_factor']
  }
];

export const TemplateSelector = ({ onSelect, selectedType }: TemplateSelectorProps) => {
  return (
    <div className="space-y-8">
      {categoryLabels.map((category, categoryIndex) => (
        <div key={categoryIndex}>
          <h3 className="text-lg font-semibold mb-4 text-foreground">{category.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {category.types.map((type) => {
              const template = reportTemplates[type];
              if (!template) return null;
              
              return (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    selectedType === type ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onSelect(type)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {templateIcons[type]}
                      </div>
                      {selectedType === type && (
                        <Badge variant="default" className="text-xs">✓</Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm mt-2 leading-tight">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      {template.categories[0]?.fields.length || 0} fields
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
