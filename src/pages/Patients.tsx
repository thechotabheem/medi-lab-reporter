import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Download,
  Star,
  StarOff,
} from 'lucide-react';
import { calculateAgeFromDOB } from '@/lib/utils';
import { exportToCSV } from '@/lib/csv-export';
import { toast } from 'sonner';

const PINNED_KEY = 'lab-reporter-pinned-patients';

function getPinnedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]');
  } catch { return []; }
}

function togglePin(id: string): string[] {
  const current = getPinnedIds();
  const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  return next;
}

export default function Patients() {
  const navigate = useNavigate();
  const { data: patients, isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(getPinnedIds);

  const filteredPatients = patients?.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(searchLower) ||
      patient.patient_id_number?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Sort: pinned first, then alphabetical
  const sortedPatients = filteredPatients?.slice().sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const handleExportCSV = () => {
    if (!filteredPatients?.length) return;
    exportToCSV(
      filteredPatients.map((p) => ({
        name: p.full_name,
        id_number: p.patient_id_number || '',
        age: calculateAgeFromDOB(p.date_of_birth),
        gender: p.gender,
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
      })),
      [
        { key: 'name', label: 'Full Name' },
        { key: 'id_number', label: 'Patient ID' },
        { key: 'age', label: 'Age' },
        { key: 'gender', label: 'Gender' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' },
      ],
      `patients-export-${new Date().toISOString().split('T')[0]}`
    );
    toast.success('Patients exported to CSV');
  };

  const handleTogglePin = (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation();
    const next = togglePin(patientId);
    setPinnedIds(next);
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Patients"
        subtitle={`Manage patient records${patients?.length ? ` (${patients.length})` : ''}`}
        icon={<Users className="h-5 w-5" />}
        showBack
        backPath="/dashboard"
      />
      
      <HeaderDivider />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 animate-fade-in">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {filteredPatients && filteredPatients.length > 0 && (
              <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button onClick={() => navigate('/patients/new')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse-glow">
                <CardHeader className="p-4">
                  <div className="h-5 skeleton w-3/4 mb-2" />
                  <div className="h-4 skeleton w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="h-4 skeleton w-2/3" />
                  <div className="h-4 skeleton w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedPatients?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description={
              searchTerm
                ? 'Try a different search term'
                : 'Add your first patient to get started'
            }
            actionLabel={!searchTerm ? 'Add Patient' : undefined}
            onAction={!searchTerm ? () => navigate('/patients/new') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sortedPatients?.map((patient, index) => {
              const age = calculateAgeFromDOB(patient.date_of_birth);
              const isPinned = pinnedIds.includes(patient.id);
              return (
                <Card
                  key={patient.id}
                  className="group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:scale-[1.02] animate-fade-in-up animate-pulse-glow card-gradient-overlay"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${patient.full_name}, ${age} years, ${patient.gender}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/patients/${patient.id}`); } }}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
                        {patient.full_name}
                      </CardTitle>
                      <button
                        onClick={(e) => handleTogglePin(e, patient.id)}
                        className="p-1 rounded-md hover:bg-primary/10 transition-colors"
                        aria-label={isPinned ? 'Unpin patient' : 'Pin patient'}
                      >
                        {isPinned ? (
                          <Star className="h-4 w-4 text-primary fill-primary" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      {patient.patient_id_number || 'No ID'} • {age} years • {patient.gender}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                        <span className="truncate">{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </EnhancedPageLayout>
  );
}
