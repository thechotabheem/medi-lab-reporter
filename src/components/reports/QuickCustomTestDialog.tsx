import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Trash2, Zap, X } from 'lucide-react';
import type { TestField, TestCategory, ReportTemplate } from '@/types/database';

export interface QuickCustomTestData {
  name: string;
  code: string;
  categories: TestCategory[];
  saveAsTemplate: boolean;
}

interface QuickCustomTestDialogProps {
  onAdd: (test: QuickCustomTestData) => void;
  onSaveAsTemplate?: (test: QuickCustomTestData) => Promise<void>;
}

const generateCode = (name: string): string => {
  return `quick_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}_${Date.now()}`;
};

export const QuickCustomTestDialog = ({ onAdd, onSaveAsTemplate }: QuickCustomTestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [testName, setTestName] = useState('');
  const [fields, setFields] = useState<TestField[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newField, setNewField] = useState<Partial<TestField>>({ type: 'number' });

  const resetForm = useCallback(() => {
    setTestName('');
    setFields([]);
    setSaveAsTemplate(false);
    setNewField({ type: 'number' });
  }, []);

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleAddField = () => {
    if (!newField.label) return;
    
    const fieldName = `quick_field_${newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    
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

    setFields(prev => [...prev, field]);
    setNewField({ type: 'number' });
  };

  const handleRemoveField = (fieldName: string) => {
    setFields(prev => prev.filter(f => f.name !== fieldName));
  };

  const handleAdd = async () => {
    if (!testName.trim() || fields.length === 0) return;

    const code = generateCode(testName);
    const testData: QuickCustomTestData = {
      name: testName.trim(),
      code,
      categories: [{ name: testName.trim(), fields }],
      saveAsTemplate,
    };

    if (saveAsTemplate && onSaveAsTemplate) {
      setIsSaving(true);
      try {
        await onSaveAsTemplate(testData);
      } finally {
        setIsSaving(false);
      }
    }

    onAdd(testData);
    handleClose();
  };

  const canAdd = testName.trim().length > 0 && fields.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <div
          className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-primary/30 cursor-pointer transition-all
            hover:border-primary hover:bg-primary/5"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-foreground">Quick Custom Test</span>
            <p className="text-xs text-muted-foreground">Add a one-off test with custom fields</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Custom Test
          </DialogTitle>
          <DialogDescription>
            Create a one-off test for this report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Test Name */}
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name *</Label>
            <Input
              id="testName"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Thyroid Panel, Vitamin D"
            />
          </div>

          {/* Add Field Form */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Add Field</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Label *</Label>
                <Input
                  value={newField.label || ''}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., TSH"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
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
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input
                    value={newField.unit || ''}
                    onChange={(e) => setNewField(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="mIU/L"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
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
                  <Label className="text-xs text-muted-foreground">Max</Label>
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
                <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
                <Input
                  value={newField.options?.join(', ') || ''}
                  onChange={(e) => setNewField(prev => ({
                    ...prev,
                    options: e.target.value.split(',').map(o => o.trim()).filter(Boolean),
                  }))}
                  placeholder="Negative, Positive"
                />
              </div>
            )}

            <Button 
              onClick={handleAddField} 
              disabled={!newField.label}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>

          {/* Fields List */}
          {fields.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Fields ({fields.length})</Label>
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {fields.map(field => (
                    <div 
                      key={field.name}
                      className="flex items-center justify-between p-2 border rounded bg-card"
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
                        onClick={() => handleRemoveField(field.name)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Save as Template Option */}
          {onSaveAsTemplate && (
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="saveAsTemplate"
                checked={saveAsTemplate}
                onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
              />
              <Label htmlFor="saveAsTemplate" className="text-sm cursor-pointer">
                Save as reusable template
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canAdd || isSaving}>
            {isSaving ? 'Saving...' : 'Add to Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
