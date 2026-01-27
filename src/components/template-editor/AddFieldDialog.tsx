import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { CustomField } from '@/hooks/useCustomTemplates';

interface AddFieldDialogProps {
  categories: string[];
  onAdd: (field: CustomField) => void;
}

export const AddFieldDialog = ({ categories, onAdd }: AddFieldDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    type: 'number',
    categoryName: categories[0] || '',
  });

  const handleAdd = () => {
    if (!newField.label || !newField.categoryName) return;

    const fieldName = `custom_${newField.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    onAdd({
      name: fieldName,
      label: newField.label,
      unit: newField.unit,
      type: newField.type as 'number' | 'text' | 'select' | 'textarea',
      categoryName: newField.categoryName,
      normalRange:
        newField.type === 'number' && (newField.normalRange?.min || newField.normalRange?.max)
          ? newField.normalRange
          : undefined,
      options: newField.type === 'select' ? newField.options : undefined,
    });

    setNewField({ type: 'number', categoryName: categories[0] || '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Field</DialogTitle>
          <DialogDescription>Add a new field to this report template.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fieldLabel">Field Label *</Label>
            <Input
              id="fieldLabel"
              value={newField.label || ''}
              onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., CRP, Vitamin D"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={newField.categoryName}
              onValueChange={(value) => setNewField((prev) => ({ ...prev, categoryName: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ New Category</SelectItem>
              </SelectContent>
            </Select>
            {newField.categoryName === '__new__' && (
              <Input
                placeholder="Enter new category name"
                className="mt-2"
                onChange={(e) => setNewField((prev) => ({ ...prev, categoryName: e.target.value }))}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldType">Field Type</Label>
            <Select
              value={newField.type}
              onValueChange={(value) =>
                setNewField((prev) => ({
                  ...prev,
                  type: value as 'number' | 'text' | 'select' | 'textarea',
                }))
              }
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

          {newField.type === 'number' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={newField.unit || ''}
                  onChange={(e) => setNewField((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., mg/dL, IU/L"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minRange">Normal Range Min</Label>
                  <Input
                    id="minRange"
                    type="number"
                    value={newField.normalRange?.min ?? ''}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        normalRange: {
                          ...prev.normalRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRange">Normal Range Max</Label>
                  <Input
                    id="maxRange"
                    type="number"
                    value={newField.normalRange?.max ?? ''}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        normalRange: {
                          ...prev.normalRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      }))
                    }
                    placeholder="100"
                  />
                </div>
              </div>
            </>
          )}

          {newField.type === 'select' && (
            <div className="space-y-2">
              <Label htmlFor="options">Options (comma-separated)</Label>
              <Input
                id="options"
                value={newField.options?.join(', ') || ''}
                onChange={(e) =>
                  setNewField((prev) => ({
                    ...prev,
                    options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                  }))
                }
                placeholder="e.g., Negative, Positive"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!newField.label || !newField.categoryName}>
            Add Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
