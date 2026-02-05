import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, ChevronRight, ChevronLeft, Beaker, X, GripVertical, Pencil } from 'lucide-react';
import type { TestField, TestCategory } from '@/types/database';

interface CustomTemplateData {
  name: string;
  code: string;
  description?: string;
  categories: TestCategory[];
}

interface ExistingTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  categories: TestCategory[];
}

interface EditCustomTemplateDialogProps {
  template: ExistingTemplate;
  onSave: (data: { code: string; templateData: CustomTemplateData }) => Promise<unknown>;
  isSaving?: boolean;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and description' },
  { id: 2, title: 'Categories', description: 'Organize fields into categories' },
  { id: 3, title: 'Fields', description: 'Add test fields to categories' },
  { id: 4, title: 'Preview', description: 'Review your changes' },
];

export const EditCustomTemplateDialog = ({ template, onSave, isSaving }: EditCustomTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editedTemplate, setEditedTemplate] = useState<CustomTemplateData>({
    name: template.name,
    code: template.code,
    description: template.description || '',
    categories: template.categories,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newField, setNewField] = useState<Partial<TestField>>({ type: 'number' });

  // Reset form when dialog opens with template data
  useEffect(() => {
    if (open) {
      setStep(1);
      setEditedTemplate({
        name: template.name,
        code: template.code,
        description: template.description || '',
        categories: JSON.parse(JSON.stringify(template.categories)), // Deep copy
      });
      setNewCategoryName('');
      setSelectedCategory(null);
      setNewField({ type: 'number' });
    }
  }, [open, template]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (editedTemplate.categories.some(c => c.name === newCategoryName.trim())) {
      return;
    }
    setEditedTemplate(prev => ({
      ...prev,
      categories: [...prev.categories, { name: newCategoryName.trim(), fields: [] }],
    }));
    setNewCategoryName('');
  };

  const handleRemoveCategory = (categoryName: string) => {
    setEditedTemplate(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.name !== categoryName),
    }));
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    }
  };

  const handleAddField = () => {
    if (!selectedCategory || !newField.label) return;
    
    const fieldName = `${editedTemplate.code}_${newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    
    const field: TestField = {
      name: fieldName,
      label: newField.label,
      type: newField.type || 'number',
      unit: newField.unit,
      normalRange: newField.type === 'number' && (newField.normalRange?.min !== undefined || newField.normalRange?.max !== undefined)
        ? newField.normalRange
        : undefined,
      options: newField.type === 'select' ? newField.options : undefined,
    };

    setEditedTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === selectedCategory
          ? { ...cat, fields: [...cat.fields, field] }
          : cat
      ),
    }));
    setNewField({ type: 'number' });
  };

  const handleRemoveField = (categoryName: string, fieldName: string) => {
    setEditedTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === categoryName
          ? { ...cat, fields: cat.fields.filter(f => f.name !== fieldName) }
          : cat
      ),
    }));
  };

  const handleSave = async () => {
    await onSave({ 
      code: template.code, 
      templateData: editedTemplate 
    });
    handleClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return editedTemplate.name.trim().length > 0;
      case 2: return editedTemplate.categories.length > 0;
      case 3: return editedTemplate.categories.some(c => c.fields.length > 0);
      case 4: return true;
      default: return false;
    }
  };

  const totalFields = editedTemplate.categories.reduce((sum, cat) => sum + cat.fields.length, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit template">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Edit Custom Template
          </DialogTitle>
          <DialogDescription>
            Step {step} of 4: {STEPS[step - 1].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div 
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s.id <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {i < STEPS.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="min-h-[300px]">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Thyroid Panel, Liver Enzymes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateCode">Template Code</Label>
                  <Input
                    id="templateCode"
                    value={editedTemplate.code}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Code cannot be changed to preserve report associations</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={editedTemplate.description || ''}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this test panel"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Categories */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {editedTemplate.categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No categories yet.</p>
                    <p className="text-sm">Add at least one category to organize your fields.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editedTemplate.categories.map((cat) => (
                      <div 
                        key={cat.name}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{cat.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {cat.fields.length} fields
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCategory(cat.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Fields */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Category</Label>
                  <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category to add fields" />
                    </SelectTrigger>
                    <SelectContent>
                      {editedTemplate.categories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name} ({cat.fields.length} fields)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Add Field to {selectedCategory}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Field Label *</Label>
                          <Input
                            value={newField.label || ''}
                            onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="e.g., TSH, T3"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={newField.type}
                            onValueChange={(v) => setNewField(prev => ({ ...prev, type: v as TestField['type'] }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {newField.type === 'number' && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={newField.unit || ''}
                              onChange={(e) => setNewField(prev => ({ ...prev, unit: e.target.value }))}
                              placeholder="e.g., mIU/L"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Min Range</Label>
                            <Input
                              type="number"
                              value={newField.normalRange?.min ?? ''}
                              onChange={(e) => setNewField(prev => ({
                                ...prev,
                                normalRange: {
                                  ...prev.normalRange,
                                  min: e.target.value ? parseFloat(e.target.value) : undefined,
                                },
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Range</Label>
                            <Input
                              type="number"
                              value={newField.normalRange?.max ?? ''}
                              onChange={(e) => setNewField(prev => ({
                                ...prev,
                                normalRange: {
                                  ...prev.normalRange,
                                  max: e.target.value ? parseFloat(e.target.value) : undefined,
                                },
                              }))}
                            />
                          </div>
                        </div>
                      )}

                      {newField.type === 'select' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={newField.options?.join(', ') || ''}
                            onChange={(e) => setNewField(prev => ({
                              ...prev,
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean),
                            }))}
                            placeholder="e.g., Negative, Positive"
                          />
                        </div>
                      )}

                      <Button 
                        onClick={handleAddField} 
                        disabled={!newField.label}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Field
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Show existing fields */}
                <Accordion type="multiple" defaultValue={editedTemplate.categories.map(c => c.name)}>
                  {editedTemplate.categories.map(cat => (
                    <AccordionItem key={cat.name} value={cat.name}>
                      <AccordionTrigger className="text-sm">
                        {cat.name} ({cat.fields.length} fields)
                      </AccordionTrigger>
                      <AccordionContent>
                        {cat.fields.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No fields yet</p>
                        ) : (
                          <div className="space-y-2">
                            {cat.fields.map(field => (
                              <div 
                                key={field.name}
                                className="flex items-center justify-between p-2 border rounded bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{field.label}</span>
                                  <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                  {field.unit && (
                                    <span className="text-xs text-muted-foreground">({field.unit})</span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveField(cat.name, field.name)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Beaker className="h-5 w-5" />
                      {editedTemplate.name}
                    </CardTitle>
                    {editedTemplate.description && (
                      <CardDescription>{editedTemplate.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Badge>{editedTemplate.categories.length} categories</Badge>
                      <Badge variant="secondary">{totalFields} fields</Badge>
                    </div>

                    <Accordion type="multiple" defaultValue={editedTemplate.categories.map(c => c.name)}>
                      {editedTemplate.categories.map(cat => (
                        <AccordionItem key={cat.name} value={cat.name}>
                          <AccordionTrigger>{cat.name}</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-2">
                              {cat.fields.map(field => (
                                <div 
                                  key={field.name}
                                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                >
                                  <div>
                                    <span className="font-medium">{field.label}</span>
                                    {field.unit && (
                                      <span className="text-muted-foreground ml-1">({field.unit})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline">{field.type}</Badge>
                                    {field.normalRange && (
                                      <span>
                                        {field.normalRange.min ?? '—'} - {field.normalRange.max ?? '—'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2 pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving || !canProceed()}>
                {isSaving ? 'Saving...' : 'Update Template'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
