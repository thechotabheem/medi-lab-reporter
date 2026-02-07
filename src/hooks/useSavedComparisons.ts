import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';

export interface SavedComparison {
  id: string;
  clinic_id: string;
  patient_id: string;
  name: string;
  report_ids: string[];
  comparison_mode: 'dual' | 'multi';
  created_at: string;
  updated_at: string;
}

export function useSavedComparisons(patientId: string | undefined) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  // Fetch saved comparisons for a patient
  const { data: savedComparisons, isLoading } = useQuery({
    queryKey: ['saved-comparisons', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('saved_comparisons')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedComparison[];
    },
    enabled: !!patientId,
  });

  // Save a comparison
  const saveComparison = useMutation({
    mutationFn: async ({
      name,
      reportIds,
      comparisonMode,
    }: {
      name: string;
      reportIds: string[];
      comparisonMode: 'dual' | 'multi';
    }) => {
      if (!patientId || !clinic?.id) {
        throw new Error('Patient ID and Clinic ID are required');
      }

      const { data, error } = await supabase
        .from('saved_comparisons')
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          name,
          report_ids: reportIds,
          comparison_mode: comparisonMode,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedComparison;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-comparisons', patientId] });
      toast.success('Comparison saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save comparison:', error);
      toast.error('Failed to save comparison');
    },
  });

  // Delete a saved comparison
  const deleteComparison = useMutation({
    mutationFn: async (comparisonId: string) => {
      const { error } = await supabase
        .from('saved_comparisons')
        .delete()
        .eq('id', comparisonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-comparisons', patientId] });
      toast.success('Comparison deleted');
    },
    onError: (error) => {
      console.error('Failed to delete comparison:', error);
      toast.error('Failed to delete comparison');
    },
  });

  return {
    savedComparisons,
    isLoading,
    saveComparison,
    deleteComparison,
  };
}
