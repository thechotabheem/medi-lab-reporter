import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic, DEFAULT_CLINIC_ID } from '@/contexts/ClinicContext';
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

// Helper function to apply customizations to a template
export const applyCustomizations = (
  baseTemplate: ReportTemplate,
  customizations: TemplateCustomization | null
): ReportTemplate => {
  if (!customizations) return baseTemplate;

  const { fields: fieldCustomizations, customFields, categoryOrder } = customizations;

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

    // Sort by order if specified
    fields = fields.sort((a, b) => {
      const orderA = fieldCustomizations[a.name]?.order ?? 999;
      const orderB = fieldCustomizations[b.name]?.order ?? 999;
      return orderA - orderB;
    });

    return {
      ...category,
      fields,
    };
  });

  // Add custom fields to their categories
  if (customFields && customFields.length > 0) {
    customFields.forEach((customField) => {
      const categoryIndex = categories.findIndex((c) => c.name === customField.categoryName);
      if (categoryIndex !== -1) {
        categories[categoryIndex].fields.push({
          name: customField.name,
          label: customField.label,
          unit: customField.unit,
          type: customField.type,
          normalRange: customField.normalRange,
          options: customField.options,
        });
      } else {
        // Create new category for custom field if it doesn't exist
        categories.push({
          name: customField.categoryName,
          fields: [
            {
              name: customField.name,
              label: customField.label,
              unit: customField.unit,
              type: customField.type,
              normalRange: customField.normalRange,
              options: customField.options,
            },
          ],
        });
      }
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

// Hook to get a customized template
export const useCustomizedTemplate = (reportType: ReportType | null) => {
  const { data: customTemplate, isLoading } = useCustomTemplate(reportType);

  if (!reportType || isLoading) {
    return { template: null, isLoading };
  }

  const baseTemplate = reportTemplates[reportType];
  const customizations = parseCustomizations(customTemplate?.customizations);
  const template = applyCustomizations(baseTemplate, customizations);

  return { template, isLoading, customizations };
};
