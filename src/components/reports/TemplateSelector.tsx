import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { reportTemplates, activeReportTypes } from '@/lib/report-templates';
import { useFullyCustomTemplates, useSaveFullyCustomTemplate } from '@/hooks/useCustomTemplates';
import { QuickCustomTestDialog, type QuickCustomTestData } from '@/components/reports/QuickCustomTestDialog';
import type { ReportType } from '@/types/database';
import { Check, Search, Layers, Beaker, Zap } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
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
  // Custom test support
  customTests?: QuickCustomTestData[];
  onAddCustomTest?: (test: QuickCustomTestData) => void;
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
  customTests = [],
  onAddCustomTest,
}: TemplateSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  
  // Fetch fully custom templates from the database
  const { data: fullyCustomTemplates } = useFullyCustomTemplates();
  const { mutateAsync: saveAsTemplate } = useSaveFullyCustomTemplate();

  // Filter built-in types
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

  // Filter custom templates
  const filteredCustomTemplates = useMemo(() => {
    if (!fullyCustomTemplates) return [];
    if (!debouncedSearch.trim()) return fullyCustomTemplates;
    
    const query = debouncedSearch.toLowerCase();
    return fullyCustomTemplates.filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.code.toLowerCase().includes(query)
    );
  }, [debouncedSearch, fullyCustomTemplates]);

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

  // Handle adding a quick custom test
  const handleAddQuickTest = (test: QuickCustomTestData) => {
    if (onAddCustomTest) {
      onAddCustomTest(test);
    }
  };

  // Handle saving a quick test as a reusable template
  const handleSaveAsTemplate = async (test: QuickCustomTestData) => {
    await saveAsTemplate({
      name: test.name,
      code: test.code.replace('quick_', 'custom_'),
      categories: test.categories,
    });
  };

  const isSelected = (type: ReportType) => {
    if (multiSelect) {
      return selectedTypes.includes(type);
    }
    return selectedType === type;
  };

  // Check if a custom template code is selected
  const isCustomSelected = (code: string) => {
    return selectedTypes.includes(code as ReportType);
  };

  // Handle custom template toggle
  const handleCustomToggle = (code: string, name: string) => {
    if (multiSelect && onMultiSelect) {
      const codeAsType = code as ReportType;
      if (selectedTypes.includes(codeAsType)) {
        onMultiSelect(selectedTypes.filter(t => t !== codeAsType));
      } else {
        onMultiSelect([...selectedTypes, codeAsType]);
      }
    } else {
      // Single-select mode: call onSelect with the custom template code
      onSelect(code as ReportType);
    }
  };

  // Get display name for selected types (including custom)
  const getSelectedDisplayName = (type: string) => {
    const builtIn = reportTemplates[type as ReportType];
    if (builtIn) return builtIn.name;
    
    const custom = fullyCustomTemplates?.find(t => t.code === type);
    if (custom) return custom.name;
    
    // Check quick custom tests
    const quickTest = customTests.find(t => t.code === type);
    if (quickTest) return quickTest.name;
    
    return type;
  };

  const hasResults = filteredTypes.length > 0 || filteredCustomTemplates.length > 0;

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
                {getSelectedDisplayName(type)}
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
        {/* Quick Custom Test Option (only in multiSelect / combined mode) */}
        {multiSelect && onAddCustomTest && (
          <QuickCustomTestDialog 
            onAdd={handleAddQuickTest}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        )}

        {/* Quick Custom Tests already added */}
        {customTests.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground font-medium">Custom Tests in this Report</p>
            {customTests.map((test) => (
              <div
                key={test.code}
                className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5"
              >
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{test.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {test.categories[0]?.fields.length || 0} fields
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Templates from Database */}
        {filteredCustomTemplates.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground font-medium">Your Custom Templates</p>
            {filteredCustomTemplates.map((template) => {
              const selected = isCustomSelected(template.code);
              const fieldCount = template.categories.reduce((sum, c) => sum + c.fields.length, 0);
              
              return (
                <div
                  key={template.code}
                  onClick={() => handleCustomToggle(template.code, template.name)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    hover:border-primary hover:bg-primary/5
                    ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border'}`}
                >
                  {multiSelect && (
                    <Checkbox 
                      checked={selected}
                      className="pointer-events-none"
                    />
                  )}
                  <div className={`p-2 rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Beaker className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{template.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{fieldCount} fields</span>
                  {!multiSelect && selected && (
                    <Badge variant="default" className="ml-2">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Built-in Templates */}
        {filteredTypes.length > 0 && (
          <>
            {(filteredCustomTemplates.length > 0 || customTests.length > 0) && (
              <p className="text-xs text-muted-foreground font-medium">Built-in Tests</p>
            )}
            {filteredTypes.map((type) => {
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
            })}
          </>
        )}

        {!hasResults && (
          <p className="text-center text-muted-foreground py-4">No test types found</p>
        )}
      </div>
    </div>
  );
};
