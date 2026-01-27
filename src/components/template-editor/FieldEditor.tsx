import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { TestField } from '@/types/database';
import type { FieldCustomization } from '@/hooks/useCustomTemplates';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface FieldEditorProps {
  field: TestField;
  customization: FieldCustomization;
  isCustomField?: boolean;
  onUpdate: (fieldName: string, updates: Partial<FieldCustomization>) => void;
  onDelete?: (fieldName: string) => void;
  dragHandleProps?: SyntheticListenerMap;
}

export const FieldEditor = ({
  field,
  customization,
  isCustomField = false,
  onUpdate,
  onDelete,
  dragHandleProps,
}: FieldEditorProps) => {
  const isHidden = customization.hidden;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 hover:border-primary/40 ${
        isHidden ? 'bg-muted/50 opacity-60' : 'bg-background'
      }`}
    >
      <div
        className="cursor-grab active:cursor-grabbing touch-none shrink-0"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Input
            value={customization.customLabel || field.label}
            onChange={(e) => onUpdate(field.name, { customLabel: e.target.value })}
            className="h-8 text-sm font-medium"
            disabled={isHidden}
            placeholder="Field label"
          />
          {field.calculated && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Auto
            </Badge>
          )}
          {isCustomField && (
            <Badge variant="outline" className="text-xs shrink-0 text-primary border-primary">
              Custom
            </Badge>
          )}
        </div>

        {field.type === 'number' && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-muted-foreground">Unit:</span>
            <Input
              value={customization.customUnit ?? field.unit ?? ''}
              onChange={(e) => onUpdate(field.name, { customUnit: e.target.value })}
              className="h-6 w-20 text-xs"
              disabled={isHidden}
              placeholder="Unit"
            />
            <span className="text-muted-foreground ml-2">Range:</span>
            <Input
              type="number"
              placeholder="Min"
              value={customization.customNormalRange?.min ?? field.normalRange?.min ?? ''}
              onChange={(e) =>
                onUpdate(field.name, {
                  customNormalRange: {
                    ...customization.customNormalRange,
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                })
              }
              className="h-6 w-16 text-xs"
              disabled={isHidden}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={customization.customNormalRange?.max ?? field.normalRange?.max ?? ''}
              onChange={(e) =>
                onUpdate(field.name, {
                  customNormalRange: {
                    ...customization.customNormalRange,
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                })
              }
              className="h-6 w-16 text-xs"
              disabled={isHidden}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isCustomField && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(field.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdate(field.name, { hidden: !isHidden })}
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
