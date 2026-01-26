import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, 
  Settings2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { reportTemplates, activeReportTypes, getReportTypeName } from '@/lib/report-templates';
import type { ReportType, TestField } from '@/types/database';

interface FieldCustomization {
  hidden?: boolean;
  customLabel?: string;
  customNormalRange?: {
    min?: number;
    max?: number;
  };
}

interface TemplateCustomization {
  fields: Record<string, FieldCustomization>;
}

export default function TemplateEditor() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [customizations, setCustomizations] = useState<TemplateCustomization>({ fields: {} });
  const [hasChanges, setHasChanges] = useState(false);

  const template = selectedTemplate ? reportTemplates[selectedTemplate] : null;

  const handleFieldCustomization = (fieldName: string, updates: Partial<FieldCustomization>) => {
    setCustomizations(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          ...updates,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setCustomizations({ fields: {} });
    setHasChanges(false);
  };

  const handleSave = () => {
    // TODO: Save to database when custom_templates table is ready
    console.log('Saving customizations:', customizations);
    setHasChanges(false);
  };

  const getFieldCustomization = (fieldName: string): FieldCustomization => {
    return customizations.fields[fieldName] || {};
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Template Editor"
        subtitle="Customize report templates"
        icon={<Settings2 className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Template Selection */}
          <FadeIn>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Select Template</CardTitle>
                <CardDescription>Choose a template to customize</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {activeReportTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedTemplate === type ? 'default' : 'outline'}
                      className="justify-start text-left h-auto py-2"
                      onClick={() => setSelectedTemplate(type)}
                    >
                      <FileText className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate text-xs">{getReportTypeName(type)}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Template Customization */}
          {template && (
            <FadeIn delay={100}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <IconWrapper size="sm">
                          <FileText className="h-4 w-4" />
                        </IconWrapper>
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        Customize fields, labels, and normal ranges
                      </CardDescription>
                    </div>
                    {hasChanges && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unsaved changes
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={template.categories.map(c => c.name)}>
                    {template.categories.map((category) => (
                      <AccordionItem key={category.name} value={category.name}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.fields.length} fields
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {category.fields.map((field) => {
                              const customization = getFieldCustomization(field.name);
                              const isHidden = customization.hidden;

                              return (
                                <div
                                  key={field.name}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    isHidden ? 'bg-muted/50 opacity-60' : 'bg-background'
                                  }`}
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Input
                                        value={customization.customLabel || field.label}
                                        onChange={(e) => handleFieldCustomization(field.name, { customLabel: e.target.value })}
                                        className="h-8 text-sm font-medium"
                                        disabled={isHidden}
                                      />
                                      {field.calculated && (
                                        <Badge variant="secondary" className="text-xs shrink-0">Auto</Badge>
                                      )}
                                    </div>
                                    
                                    {field.type === 'number' && field.normalRange && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Range:</span>
                                        <Input
                                          type="number"
                                          placeholder="Min"
                                          value={customization.customNormalRange?.min ?? field.normalRange.min ?? ''}
                                          onChange={(e) => handleFieldCustomization(field.name, {
                                            customNormalRange: {
                                              ...customization.customNormalRange,
                                              min: e.target.value ? parseFloat(e.target.value) : undefined,
                                            },
                                          })}
                                          className="h-6 w-16 text-xs"
                                          disabled={isHidden}
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                          type="number"
                                          placeholder="Max"
                                          value={customization.customNormalRange?.max ?? field.normalRange.max ?? ''}
                                          onChange={(e) => handleFieldCustomization(field.name, {
                                            customNormalRange: {
                                              ...customization.customNormalRange,
                                              max: e.target.value ? parseFloat(e.target.value) : undefined,
                                            },
                                          })}
                                          className="h-6 w-16 text-xs"
                                          disabled={isHidden}
                                        />
                                        {field.unit && (
                                          <span className="text-muted-foreground">{field.unit}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => handleFieldCustomization(field.name, { hidden: !isHidden })}
                                  >
                                    {isHidden ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges} className="flex-1 sm:flex-none">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {!selectedTemplate && (
            <FadeIn delay={100}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <IconWrapper size="lg" variant="muted" className="mb-4">
                    <Settings2 className="h-6 w-6" />
                  </IconWrapper>
                  <h3 className="font-medium mb-1">No Template Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a template above to start customizing
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
