import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableFieldEditor } from '@/components/template-editor/SortableFieldEditor';
import { AddFieldDialog } from '@/components/template-editor/AddFieldDialog';
import { CloneTemplateDialog } from '@/components/template-editor/CloneTemplateDialog';
import { 
  FileText, 
  Settings2, 
  Save,
  RotateCcw,
  AlertCircle,
  Loader2,
  Check,
  GripVertical,
} from 'lucide-react';
import { reportTemplates, activeReportTypes, getReportTypeName } from '@/lib/report-templates';
import { 
  useCustomTemplate, 
  useSaveCustomTemplate, 
  useDeleteCustomTemplate,
  useAllCustomTemplates,
  type TemplateCustomization,
  type FieldCustomization,
  type CustomField,
} from '@/hooks/useCustomTemplates';
import type { ReportType, TestField } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Helper to safely parse customizations from JSON
const parseCustomizations = (json: Json | null | undefined): TemplateCustomization => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { fields: {}, fieldOrder: {} };
  }
  const obj = json as Record<string, unknown>;
  return {
    fields: (obj.fields as Record<string, FieldCustomization>) || {},
    customFields: (obj.customFields as CustomField[]) || [],
    categoryOrder: (obj.categoryOrder as string[]) || [],
    fieldOrder: (obj.fieldOrder as Record<string, string[]>) || {},
  };
};

export default function TemplateEditor() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [customizations, setCustomizations] = useState<TemplateCustomization>({ fields: {}, fieldOrder: {} });
  const [hasChanges, setHasChanges] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing customization
  const { data: existingCustomization, isLoading: isLoadingTemplate } = useCustomTemplate(selectedTemplate);
  const { data: allCustomTemplates } = useAllCustomTemplates();
  const { mutate: saveTemplate, isPending: isSaving } = useSaveCustomTemplate();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteCustomTemplate();

  const template = selectedTemplate ? reportTemplates[selectedTemplate] : null;

  // Load existing customizations when template changes
  useEffect(() => {
    if (existingCustomization) {
      setCustomizations(parseCustomizations(existingCustomization.customizations));
      setHasChanges(false);
    } else if (selectedTemplate) {
      setCustomizations({ fields: {}, customFields: [], categoryOrder: [], fieldOrder: {} });
      setHasChanges(false);
    }
  }, [existingCustomization, selectedTemplate]);

  // Get all category names for the add field dialog
  const categoryNames = useMemo(() => {
    if (!template) return [];
    const names = template.categories.map(c => c.name);
    // Add any custom category names
    const customCategoryNames = customizations.customFields
      ?.map(f => f.categoryName)
      .filter(name => !names.includes(name)) || [];
    return [...names, ...customCategoryNames];
  }, [template, customizations.customFields]);

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

  const handleAddCustomField = (field: CustomField) => {
    setCustomizations(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), field],
    }));
    setHasChanges(true);
  };

  const handleDeleteCustomField = (fieldName: string) => {
    setCustomizations(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.name !== fieldName),
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    if (!selectedTemplate) return;
    deleteTemplate(selectedTemplate, {
      onSuccess: () => {
        setCustomizations({ fields: {}, customFields: [], categoryOrder: [], fieldOrder: {} });
        setHasChanges(false);
      },
    });
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    saveTemplate(
      { reportType: selectedTemplate, customizations },
      { onSuccess: () => setHasChanges(false) }
    );
  };

  // Handle drag end for field reordering
  const handleDragEnd = useCallback((event: DragEndEvent, categoryName: string, fields: TestField[]) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.name === active.id);
      const newIndex = fields.findIndex((f) => f.name === over.id);
      
      const newOrder = arrayMove(fields.map(f => f.name), oldIndex, newIndex);
      
      setCustomizations((prev) => ({
        ...prev,
        fieldOrder: {
          ...prev.fieldOrder,
          [categoryName]: newOrder,
        },
      }));
      setHasChanges(true);
    }
  }, []);

  // Clone customizations from another template
  const handleCloneTemplate = useCallback((sourceTemplate: ReportType) => {
    const sourceCustomization = allCustomTemplates?.find(
      (t) => t.base_template === sourceTemplate
    );
    
    if (!sourceCustomization) {
      toast.error('Source template has no customizations to clone');
      return;
    }

    const sourceData = parseCustomizations(sourceCustomization.customizations);
    
    // Only copy field customizations (labels, units, ranges, visibility)
    // Don't copy custom fields as they may not apply to the target template
    setCustomizations((prev) => ({
      ...prev,
      fields: { ...sourceData.fields },
      // Keep existing custom fields and field order
      customFields: prev.customFields || [],
      fieldOrder: prev.fieldOrder || {},
    }));
    
    setHasChanges(true);
    toast.success(`Cloned customizations from ${getReportTypeName(sourceTemplate)}`);
  }, [allCustomTemplates]);

  const getFieldCustomization = (fieldName: string): FieldCustomization => {
    return customizations.fields[fieldName] || {};
  };

  // Check if a field is a custom field
  const isCustomField = (fieldName: string): boolean => {
    return (customizations.customFields || []).some(f => f.name === fieldName);
  };

  // Get custom fields for a category
  const getCustomFieldsForCategory = (categoryName: string): TestField[] => {
    return (customizations.customFields || [])
      .filter(f => f.categoryName === categoryName)
      .map(f => ({
        name: f.name,
        label: f.label,
        unit: f.unit,
        type: f.type,
        normalRange: f.normalRange,
        options: f.options,
      }));
  };

  // Get custom fields that belong to new categories
  const getNewCategories = (): { name: string; fields: TestField[] }[] => {
    if (!template) return [];
    const existingCategoryNames = template.categories.map(c => c.name);
    const newCategoryNames = [...new Set(
      (customizations.customFields || [])
        .filter(f => !existingCategoryNames.includes(f.categoryName))
        .map(f => f.categoryName)
    )];
    
    return newCategoryNames.map(name => ({
      name,
      fields: getCustomFieldsForCategory(name),
    }));
  };

  // Sort fields based on saved field order
  const getSortedFields = useCallback((categoryName: string, fields: TestField[]): TestField[] => {
    const savedOrder = customizations.fieldOrder?.[categoryName];
    if (!savedOrder || savedOrder.length === 0) {
      return fields;
    }
    
    const fieldMap = new Map(fields.map(f => [f.name, f]));
    const orderedFields: TestField[] = [];
    
    // Add fields in saved order
    savedOrder.forEach(name => {
      const field = fieldMap.get(name);
      if (field) {
        orderedFields.push(field);
        fieldMap.delete(name);
      }
    });
    
    // Add any remaining fields not in saved order
    fieldMap.forEach(field => orderedFields.push(field));
    
    return orderedFields;
  }, [customizations.fieldOrder]);

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Template Editor"
        subtitle="Customize report templates"
        icon={<Settings2 className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Template Selection */}
          <FadeIn>
            <Card className="mb-6 animate-pulse-glow card-gradient-overlay">
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
                      className="justify-start text-left h-auto py-2 transition-all duration-300 hover:scale-[1.02]"
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

          {/* Loading State */}
          {selectedTemplate && isLoadingTemplate && (
            <FadeIn delay={100}>
              <Card className="animate-pulse-glow card-gradient-overlay">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Template Customization */}
          {template && !isLoadingTemplate && (
            <FadeIn delay={100}>
              <Card className="animate-pulse-glow card-gradient-overlay">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <IconWrapper size="sm" className="transition-all duration-300 hover:scale-110">
                          <FileText className="h-4 w-4" />
                        </IconWrapper>
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        Customize fields, labels, units, and normal ranges
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {existingCustomization && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Customized
                        </Badge>
                      )}
                      {hasChanges && (
                        <Badge variant="outline" className="text-warning border-warning">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unsaved changes
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Action Buttons */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <AddFieldDialog
                      categories={categoryNames}
                      onAdd={handleAddCustomField}
                    />
                    {selectedTemplate && (
                      <CloneTemplateDialog
                        currentTemplate={selectedTemplate}
                        onClone={handleCloneTemplate}
                      />
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GripVertical className="h-3.5 w-3.5" />
                      <span>Drag to reorder</span>
                    </div>
                  </div>

                  <Accordion type="multiple" defaultValue={template.categories.map(c => c.name)}>
                    {/* Existing categories */}
                    {template.categories.map((category) => {
                      const customFieldsInCategory = getCustomFieldsForCategory(category.name);
                      const allFields = [...category.fields, ...customFieldsInCategory];
                      const sortedFields = getSortedFields(category.name, allFields);

                      return (
                        <AccordionItem key={category.name} value={category.name}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{category.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {allFields.length} fields
                              </Badge>
                              {customFieldsInCategory.length > 0 && (
                                <Badge variant="outline" className="text-xs text-primary border-primary">
                                  +{customFieldsInCategory.length} custom
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleDragEnd(event, category.name, sortedFields)}
                            >
                              <SortableContext
                                items={sortedFields.map(f => f.name)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {sortedFields.map((field) => (
                                    <SortableFieldEditor
                                      key={field.name}
                                      field={field}
                                      customization={getFieldCustomization(field.name)}
                                      isCustomField={isCustomField(field.name)}
                                      onUpdate={handleFieldCustomization}
                                      onDelete={isCustomField(field.name) ? handleDeleteCustomField : undefined}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}

                    {/* New custom categories */}
                    {getNewCategories().map((category) => {
                      const sortedFields = getSortedFields(category.name, category.fields);
                      
                      return (
                        <AccordionItem key={category.name} value={category.name}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{category.name}</span>
                              <Badge variant="outline" className="text-xs text-primary border-primary">
                                {category.fields.length} custom
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleDragEnd(event, category.name, sortedFields)}
                            >
                              <SortableContext
                                items={sortedFields.map(f => f.name)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {sortedFields.map((field) => (
                                    <SortableFieldEditor
                                      key={field.name}
                                      field={field}
                                      customization={getFieldCustomization(field.name)}
                                      isCustomField={true}
                                      onUpdate={handleFieldCustomization}
                                      onDelete={handleDeleteCustomField}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={handleReset} 
                      disabled={(!hasChanges && !existingCustomization) || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reset to Default
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={!hasChanges || isSaving} 
                      className="flex-1 sm:flex-none"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {!selectedTemplate && (
            <FadeIn delay={100}>
              <Card className="border-dashed animate-pulse-glow">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <IconWrapper size="lg" variant="muted" className="mb-4 transition-all duration-300 hover:scale-110">
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
    </EnhancedPageLayout>
  );
}
