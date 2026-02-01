import { Badge } from '@/components/ui/badge';
import { reportTemplates, activeReportTypes } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';
import { Check } from 'lucide-react';
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
  blood_test: <Beaker className="h-5 w-5" />,
  urine_analysis: <Droplets className="h-5 w-5" />,
  screening_tests: <ShieldCheck className="h-5 w-5" />,
  blood_group_typing: <Droplet className="h-5 w-5" />,
  // Value Based
  cbc: <Beaker className="h-5 w-5" />,
  lft: <FlaskConical className="h-5 w-5" />,
  rft: <TestTube className="h-5 w-5" />,
  lipid_profile: <Heart className="h-5 w-5" />,
  esr: <Activity className="h-5 w-5" />,
  bsr: <Droplets className="h-5 w-5" />,
  bsf: <Droplets className="h-5 w-5" />,
  serum_calcium: <CircleDot className="h-5 w-5" />,
  // Screening
  mp: <Bug className="h-5 w-5" />,
  typhoid: <ShieldCheck className="h-5 w-5" />,
  hcv: <Syringe className="h-5 w-5" />,
  hbsag: <Syringe className="h-5 w-5" />,
  hiv: <ShieldCheck className="h-5 w-5" />,
  vdrl: <TestTube className="h-5 w-5" />,
  h_pylori: <Bug className="h-5 w-5" />,
  // Blood Group & Typing
  blood_group: <Droplet className="h-5 w-5" />,
  ra_factor: <Activity className="h-5 w-5" />,
};

export const TemplateSelector = ({ onSelect, selectedType }: TemplateSelectorProps) => {
  return (
    <div className="space-y-2">
      {activeReportTypes.map((type) => {
        const template = reportTemplates[type];
        if (!template) return null;
        
        const isSelected = selectedType === type;
        const fieldCount = template.categories[0]?.fields.length || 0;
        
        return (
          <div
            key={type}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              hover:border-primary hover:bg-primary/5
              ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border'}`}
          >
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {templateIcons[type]}
            </div>
            <span className="flex-1 font-medium text-foreground">{template.name}</span>
            <span className="text-sm text-muted-foreground">{fieldCount} fields</span>
            {isSelected && (
              <Badge variant="default" className="ml-2">
                <Check className="h-3 w-3" />
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};
