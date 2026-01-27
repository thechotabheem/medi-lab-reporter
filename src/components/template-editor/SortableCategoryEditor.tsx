import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableFieldEditor } from './SortableFieldEditor';
import type { TestField } from '@/types/database';
import type { FieldCustomization } from '@/hooks/useCustomTemplates';

interface SortableCategoryEditorProps {
  categoryName: string;
  fields: TestField[];
  customFieldCount: number;
  isNewCategory?: boolean;
  getFieldCustomization: (fieldName: string) => FieldCustomization;
  isCustomField: (fieldName: string) => boolean;
  onFieldUpdate: (fieldName: string, updates: Partial<FieldCustomization>) => void;
  onFieldDelete?: (fieldName: string) => void;
  onFieldDragEnd: (event: DragEndEvent, categoryName: string, fields: TestField[]) => void;
}

export const SortableCategoryEditor = ({
  categoryName,
  fields,
  customFieldCount,
  isNewCategory = false,
  getFieldCustomization,
  isCustomField,
  onFieldUpdate,
  onFieldDelete,
  onFieldDragEnd,
}: SortableCategoryEditorProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryName });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Sensors for field reordering within this category
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <AccordionItem value={categoryName} className="relative">
        <AccordionTrigger className="hover:no-underline group">
          <div className="flex items-center gap-2 w-full">
            {/* Category drag handle */}
            <div
              className="cursor-grab active:cursor-grabbing touch-none shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium">{categoryName}</span>
            <Badge variant="secondary" className="text-xs">
              {fields.length} fields
            </Badge>
            {customFieldCount > 0 && (
              <Badge variant="outline" className="text-xs text-primary border-primary">
                +{customFieldCount} custom
              </Badge>
            )}
            {isNewCategory && (
              <Badge variant="outline" className="text-xs text-primary border-primary">
                New
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onFieldDragEnd(event, categoryName, fields)}
          >
            <SortableContext
              items={fields.map(f => f.name)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {fields.map((field) => (
                  <SortableFieldEditor
                    key={field.name}
                    field={field}
                    customization={getFieldCustomization(field.name)}
                    isCustomField={isCustomField(field.name)}
                    onUpdate={onFieldUpdate}
                    onDelete={isCustomField(field.name) ? onFieldDelete : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};
