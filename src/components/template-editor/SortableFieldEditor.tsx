import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldEditor } from './FieldEditor';
import type { TestField } from '@/types/database';
import type { FieldCustomization } from '@/hooks/useCustomTemplates';

interface SortableFieldEditorProps {
  field: TestField;
  customization: FieldCustomization;
  isCustomField?: boolean;
  onUpdate: (fieldName: string, updates: Partial<FieldCustomization>) => void;
  onDelete?: (fieldName: string) => void;
}

export const SortableFieldEditor = ({
  field,
  customization,
  isCustomField = false,
  onUpdate,
  onDelete,
}: SortableFieldEditorProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FieldEditor
        field={field}
        customization={customization}
        isCustomField={isCustomField}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
};
