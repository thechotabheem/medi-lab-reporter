import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { reportTemplates, activeReportTypes } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';
import { Check, Search, Layers } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
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
  // Multi-select mode props
  multiSelect?: boolean;
  selectedTypes?: ReportType[];
  onMultiSelect?: (types: ReportType[]) => void;
}

const templateIcons: Partial<Record<ReportType, React.ReactNode>> = {
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

export const TemplateSelector = ({ 
  onSelect, 
  selectedType,
  multiSelect = false,
  selectedTypes = [],
  onMultiSelect,
}: TemplateSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredTypes = useMemo(() => {
    if (!debouncedSearch.trim()) return activeReportTypes;
    
    const query = debouncedSearch.toLowerCase();
    return activeReportTypes.filter((type) => {
      const template = reportTemplates[type];
      if (!template) return false;
      return (
        template.name.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch]);

  const handleToggle = (type: ReportType) => {
    if (multiSelect && onMultiSelect) {
      if (selectedTypes.includes(type)) {
        onMultiSelect(selectedTypes.filter(t => t !== type));
      } else {
        onMultiSelect([...selectedTypes, type]);
      }
    } else {
      onSelect(type);
    }
  };

  const isSelected = (type: ReportType) => {
    if (multiSelect) {
      return selectedTypes.includes(type);
    }
    return selectedType === type;
  };

  return (
    <div className="space-y-4">
      {/* Header with selection count for multi-select */}
      {multiSelect && selectedTypes.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {selectedTypes.length} test{selectedTypes.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex-1 flex flex-wrap gap-1">
            {selectedTypes.map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {reportTemplates[type]?.name || type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search test types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="space-y-2">
        {filteredTypes.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No test types found</p>
        ) : (
          filteredTypes.map((type) => {
            const template = reportTemplates[type];
            if (!template) return null;
            
            const selected = isSelected(type);
            const fieldCount = template.categories[0]?.fields.length || 0;
            
            return (
              <div
                key={type}
                onClick={() => handleToggle(type)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  hover:border-primary hover:bg-primary/5
                  ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border'}`}
              >
                {multiSelect && (
                  <Checkbox 
                    checked={selected}
                    onCheckedChange={() => handleToggle(type)}
                    className="pointer-events-none"
                  />
                )}
                <div className={`p-2 rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {templateIcons[type] || <Beaker className="h-5 w-5" />}
                </div>
                <span className="flex-1 font-medium text-foreground">{template.name}</span>
                <span className="text-sm text-muted-foreground">{fieldCount} fields</span>
                {!multiSelect && selected && (
                  <Badge variant="default" className="ml-2">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
