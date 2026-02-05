import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { reportTemplates } from '@/lib/report-templates';
import type { ReportType, ReportTemplate, TestField, TestCategory } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Customization types
export interface FieldCustomization {
  hidden?: boolean;
  customLabel?: string;
  customUnit?: string;
  customNormalRange?: {
    min?: number;
    max?: number;
  };
  order?: number;
}

export interface CustomField {
  name: string;
  label: string;
  unit?: string;
  type: 'number' | 'text' | 'select' | 'textarea';
  normalRange?: {
    min?: number;
    max?: number;
  };
  options?: string[];
  categoryName: string;
}

export interface TemplateCustomization {
  fields: Record<string, FieldCustomization>;
  customFields?: CustomField[];
  categoryOrder?: string[];
  fieldOrder?: Record<string, string[]>;
}

// Fully custom template structure (stored in customizations JSONB)
export interface FullyCustomTemplateData {
  name: string;
  code: string;
  description?: string;
  categories: TestCategory[];
  isFullyCustom: true;
  createdAt: string;
}

interface CustomTemplateRow {
  id: string;
  clinic_id: string | null;
  base_template: string;
  customizations: Json;
  created_at: string;
  updated_at: string;
}

// Fetch custom template for a specific report type
export const useCustomTemplate = (reportType: ReportType | null) => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['custom-template', clinicId, reportType],
    queryFn: async () => {
      if (!reportType) return null;

      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('base_template', reportType)
        .maybeSingle();

      if (error) {
        console.error('Error fetching custom template:', error);
        throw error;
      }

      return data as CustomTemplateRow | null;
    },
    enabled: !!reportType,
  });
};

// Fetch all custom templates for the clinic
export const useAllCustomTemplates = () => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['custom-templates', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Error fetching custom templates:', error);
        throw error;
      }

      return data as CustomTemplateRow[];
    },
  });
};

// Save/update custom template
export const useSaveCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async ({
      reportType,
      customizations,
    }: {
      reportType: ReportType;
      customizations: TemplateCustomization;
    }) => {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('custom_templates')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('base_template', reportType)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('custom_templates')
          .update({
            customizations: customizations as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('custom_templates')
          .insert({
            clinic_id: clinicId,
            base_template: reportType,
            customizations: customizations as unknown as Json,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-template', clinicId, variables.reportType] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates', clinicId] });
      toast.success('Template customizations saved successfully');
    },
    onError: (error) => {
      console.error('Error saving template customizations:', error);
      toast.error('Failed to save template customizations');
    },
  });
};

// Delete custom template (reset to default)
export const useDeleteCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async (reportType: ReportType) => {
      const { error } = await supabase
        .from('custom_templates')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('base_template', reportType);

      if (error) throw error;
    },
    onSuccess: (_, reportType) => {
      queryClient.invalidateQueries({ queryKey: ['custom-template', clinicId, reportType] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates', clinicId] });
      toast.success('Template reset to default');
    },
    onError: (error) => {
      console.error('Error deleting template customizations:', error);
      toast.error('Failed to reset template');
    },
  });
};

// ============ FULLY CUSTOM TEMPLATES ============

// Check if a base_template is a fully custom template
export const isFullyCustomTemplate = (baseTemplate: string): boolean => {
  return baseTemplate.startsWith('custom_') || baseTemplate.startsWith('quick_');
};

// Parse fully custom template data from customizations JSON
export const parseFullyCustomTemplate = (json: Json | null | undefined): FullyCustomTemplateData | null => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (obj.isFullyCustom !== true) return null;
  return obj as unknown as FullyCustomTemplateData;
};

// Fetch all fully custom templates for the clinic
export const useFullyCustomTemplates = () => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['fully-custom-templates', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .like('base_template', 'custom_%');

      if (error) {
        console.error('Error fetching fully custom templates:', error);
        throw error;
      }

      // Parse and return fully custom templates
      return (data as CustomTemplateRow[])
        .map(row => {
          const parsed = parseFullyCustomTemplate(row.customizations);
          if (!parsed) return null;
          return {
            id: row.id,
            code: row.base_template,
            ...parsed,
          };
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);
    },
  });
};

// Save a new fully custom template
export const useSaveFullyCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async (templateData: Omit<FullyCustomTemplateData, 'isFullyCustom' | 'createdAt'>) => {
      const customizations: FullyCustomTemplateData = {
        ...templateData,
        isFullyCustom: true,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('custom_templates')
        .insert({
          clinic_id: clinicId,
          base_template: templateData.code,
          customizations: customizations as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fully-custom-templates', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates', clinicId] });
      toast.success('Custom template created successfully');
    },
    onError: (error) => {
      console.error('Error creating custom template:', error);
      toast.error('Failed to create custom template');
    },
  });
};

// Delete a fully custom template
export const useDeleteFullyCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async (templateCode: string) => {
      const { error } = await supabase
        .from('custom_templates')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('base_template', templateCode);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fully-custom-templates', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates', clinicId] });
      toast.success('Custom template deleted');
    },
    onError: (error) => {
      console.error('Error deleting custom template:', error);
      toast.error('Failed to delete custom template');
    },
  });
};

// Update an existing fully custom template
export const useUpdateFullyCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async ({ 
      code, 
      templateData 
    }: { 
      code: string; 
      templateData: Omit<FullyCustomTemplateData, 'isFullyCustom' | 'createdAt'> 
    }) => {
      const customizations: FullyCustomTemplateData = {
        ...templateData,
        isFullyCustom: true,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('custom_templates')
        .update({ 
          customizations: customizations as unknown as Json,
          updated_at: new Date().toISOString() 
        })
        .eq('clinic_id', clinicId)
        .eq('base_template', code)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fully-custom-templates', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates', clinicId] });
      toast.success('Custom template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating custom template:', error);
      toast.error('Failed to update custom template');
    },
  });
};

// Convert a fully custom template to a ReportTemplate format
export const fullyCustomToReportTemplate = (custom: FullyCustomTemplateData): ReportTemplate => {
  return {
    type: 'combined' as ReportType, // Use combined as the report_type for storage
    name: custom.name,
    categories: custom.categories,
  };
};

// New: Fetch a fully custom template by its code
export const useFullyCustomTemplateByCode = (code: string | null) => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['fully-custom-template', clinicId, code],
    queryFn: async () => {
      if (!code || !isFullyCustomTemplate(code)) return null;

      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('base_template', code)
        .maybeSingle();

      if (error || !data) return null;

      const parsed = parseFullyCustomTemplate(data.customizations);
      return parsed ? fullyCustomToReportTemplate(parsed) : null;
    },
    enabled: !!code && isFullyCustomTemplate(code),
  });
};

// Helper function to apply customizations to a template
export const applyCustomizations = (
  baseTemplate: ReportTemplate,
  customizations: TemplateCustomization | null
): ReportTemplate => {
  if (!customizations) return baseTemplate;

  const { fields: fieldCustomizations, customFields, categoryOrder, fieldOrder } = customizations;

  // Start with base template categories
  let categories = baseTemplate.categories.map((category) => {
    // Apply field customizations
    let fields = category.fields
      .filter((field) => !fieldCustomizations[field.name]?.hidden)
      .map((field) => {
        const customization = fieldCustomizations[field.name];
        if (!customization) return field;

        return {
          ...field,
          label: customization.customLabel || field.label,
          unit: customization.customUnit !== undefined ? customization.customUnit : field.unit,
          normalRange: customization.customNormalRange
            ? {
                ...field.normalRange,
                min: customization.customNormalRange.min ?? field.normalRange?.min,
                max: customization.customNormalRange.max ?? field.normalRange?.max,
              }
            : field.normalRange,
        };
      });

    // Add custom fields to this category
    const customFieldsInCategory = (customFields || [])
      .filter(cf => cf.categoryName === category.name)
      .map(cf => ({
        name: cf.name,
        label: cf.label,
        unit: cf.unit,
        type: cf.type,
        normalRange: cf.normalRange,
        options: cf.options,
      }));

    fields = [...fields, ...customFieldsInCategory];

    // Apply field order if specified for this category
    const savedOrder = fieldOrder?.[category.name];
    if (savedOrder && savedOrder.length > 0) {
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
      fields = orderedFields;
    } else {
      // Sort by order property if specified (legacy support)
      fields = fields.sort((a, b) => {
        const orderA = fieldCustomizations[a.name]?.order ?? 999;
        const orderB = fieldCustomizations[b.name]?.order ?? 999;
        return orderA - orderB;
      });
    }

    return {
      ...category,
      fields,
    };
  });

  // Add new custom categories (categories that don't exist in base template)
  if (customFields && customFields.length > 0) {
    const existingCategoryNames = baseTemplate.categories.map(c => c.name);
    const newCategoryNames = [...new Set(
      customFields
        .filter(f => !existingCategoryNames.includes(f.categoryName))
        .map(f => f.categoryName)
    )];
    
    newCategoryNames.forEach(categoryName => {
      const fieldsInCategory = customFields
        .filter(f => f.categoryName === categoryName)
        .map(f => ({
          name: f.name,
          label: f.label,
          unit: f.unit,
          type: f.type,
          normalRange: f.normalRange,
          options: f.options,
        }));

      // Apply field order for new categories too
      const savedOrder = fieldOrder?.[categoryName];
      let orderedFields = fieldsInCategory;
      if (savedOrder && savedOrder.length > 0) {
        const fieldMap = new Map(fieldsInCategory.map(f => [f.name, f]));
        orderedFields = [];
        savedOrder.forEach(name => {
          const field = fieldMap.get(name);
          if (field) {
            orderedFields.push(field);
            fieldMap.delete(name);
          }
        });
        fieldMap.forEach(field => orderedFields.push(field));
      }

      categories.push({
        name: categoryName,
        fields: orderedFields,
      });
    });
  }

  // Reorder categories if specified
  if (categoryOrder && categoryOrder.length > 0) {
    categories = categories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  return {
    ...baseTemplate,
    categories,
  };
};

// Helper to safely parse customizations from JSON
const parseCustomizations = (json: Json | null | undefined): TemplateCustomization | null => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (!obj.fields || typeof obj.fields !== 'object') return null;
  return obj as unknown as TemplateCustomization;
};

// Hook to get a customized template (handles both built-in and fully custom templates)
export const useCustomizedTemplate = (reportType: ReportType | null) => {
  const { data: customTemplate, isLoading: loadingCustom } = useCustomTemplate(reportType);
  const { data: fullyCustom, isLoading: loadingFully } = useFullyCustomTemplateByCode(
    reportType && isFullyCustomTemplate(reportType as string) ? (reportType as string) : null
  );

  const isLoading = loadingCustom || loadingFully;

  if (!reportType || isLoading) {
    return { template: null, isLoading };
  }

  // Check if it's a fully custom template first
  if (isFullyCustomTemplate(reportType as string) && fullyCustom) {
    return { template: fullyCustom, isLoading: false };
  }

  // Fall back to built-in template with customizations
  const baseTemplate = reportTemplates[reportType];
  if (!baseTemplate) {
    return { template: null, isLoading: false };
  }

  const customizations = parseCustomizations(customTemplate?.customizations);
  const template = applyCustomizations(baseTemplate, customizations);

  return { template, isLoading, customizations };
};
