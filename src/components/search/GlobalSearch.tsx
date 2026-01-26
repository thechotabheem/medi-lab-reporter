import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useDebounce } from '@/hooks/useDebounce';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { FileText, User, Search, Settings, Plus, ClipboardList } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardNavigation';
import { getReportTypeName } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Search reports
  const { data: reports } = useQuery({
    queryKey: ['search-reports', clinicId, debouncedSearch],
    queryFn: async () => {
      if (!clinicId || !debouncedSearch || debouncedSearch.length < 2) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, report_type, report_number, patient:patients(full_name)')
        .eq('clinic_id', clinicId)
        .or(`report_number.ilike.%${debouncedSearch}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!clinicId && debouncedSearch.length >= 2,
  });

  // Search patients
  const { data: patients } = useQuery({
    queryKey: ['search-patients', clinicId, debouncedSearch],
    queryFn: async () => {
      if (!clinicId || !debouncedSearch || debouncedSearch.length < 2) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, patient_id_number, phone')
        .eq('clinic_id', clinicId)
        .or(`full_name.ilike.%${debouncedSearch}%,patient_id_number.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!clinicId && debouncedSearch.length >= 2,
  });

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
    setSearch('');
  }, [navigate, onOpenChange]);

  const quickActions = [
    { label: 'New Report', icon: Plus, path: '/reports/new' },
    { label: 'All Reports', icon: ClipboardList, path: '/reports' },
    { label: 'All Patients', icon: User, path: '/patients' },
    { label: 'New Patient', icon: Plus, path: '/patients/new' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search reports, patients, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions - always show */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.path}
              onSelect={() => handleSelect(action.path)}
              className="cursor-pointer"
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Reports Results */}
        {reports && reports.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Reports">
              {reports.map((report) => (
                <CommandItem
                  key={report.id}
                  onSelect={() => handleSelect(`/reports/${report.id}`)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="flex-1">
                    {getReportTypeName(report.report_type as ReportType)} - {report.report_number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {report.patient?.full_name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Patients Results */}
        {patients && patients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Patients">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handleSelect(`/patients/${patient.id}`)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span className="flex-1">{patient.full_name}</span>
                  {patient.patient_id_number && (
                    <span className="text-xs text-muted-foreground">
                      ID: {patient.patient_id_number}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

// Hook to use global search with keyboard shortcut
export const useGlobalSearch = () => {
  const [open, setOpen] = useState(false);

  // Ctrl/Cmd + K to open search
  useKeyboardShortcut('k', () => setOpen(true), { ctrl: true });
  useKeyboardShortcut('k', () => setOpen(true), { meta: true });

  return { open, setOpen };
};
