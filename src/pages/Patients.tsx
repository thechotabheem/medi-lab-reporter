import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Patients() {
  const navigate = useNavigate();
  const { data: patients, isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients?.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.patient_id_number?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Patients"
        subtitle="Manage patient records"
        icon={<Users className="h-5 w-5" />}
        showBack
        backPath="/dashboard"
      />

      {/* Main Content */}
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
          <Button onClick={() => navigate('/patients/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
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
        ) : filteredPatients?.length === 0 ? (
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
            {filteredPatients?.map((patient, index) => (
              <Card
                key={patient.id}
                className="group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
                    {patient.first_name} {patient.last_name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {patient.patient_id_number || 'No ID'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
