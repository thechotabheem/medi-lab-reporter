import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePatients } from '@/hooks/usePatients';
import { Search, User, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '@/types/database';

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
}

export const PatientSelector = ({ onSelect, selectedPatient }: PatientSelectorProps) => {
  const { data: patients, isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients?.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      patient.patient_id_number?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchTerm)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name, ID, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredPatients?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No patients found</p>
              <p className="text-sm">Add patients to create reports</p>
            </div>
          ) : (
            filteredPatients?.map((patient) => (
              <Card
                key={patient.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedPatient?.id === patient.id
                    ? 'border-primary bg-primary/5'
                    : ''
                }`}
                onClick={() => onSelect(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {patient.patient_id_number && (
                            <span>ID: {patient.patient_id_number}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}
                          </span>
                          {patient.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={selectedPatient?.id === patient.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {selectedPatient?.id === patient.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
