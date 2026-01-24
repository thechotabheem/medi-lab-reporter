import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatients } from '@/hooks/usePatients';
import { Search, User, Calendar, Phone, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import type { Patient, Gender } from '@/types/database';

export interface NewPatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone?: string;
  patient_id_number?: string;
}

interface PatientSelectorProps {
  onSelect: (patient: Patient | null) => void;
  selectedPatient?: Patient | null;
  onNewPatientChange?: (data: NewPatientData | null) => void;
  newPatientData?: NewPatientData | null;
}

export const PatientSelector = ({ 
  onSelect, 
  selectedPatient,
  onNewPatientChange,
  newPatientData 
}: PatientSelectorProps) => {
  const { data: patients, isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(selectedPatient ? 'existing' : 'new');
  
  const [newPatient, setNewPatient] = useState<NewPatientData>({
    first_name: newPatientData?.first_name || '',
    last_name: newPatientData?.last_name || '',
    date_of_birth: newPatientData?.date_of_birth || '',
    gender: newPatientData?.gender || 'male',
    phone: newPatientData?.phone || '',
    patient_id_number: newPatientData?.patient_id_number || '',
  });

  const filteredPatients = patients?.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      patient.patient_id_number?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchTerm)
    );
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'new') {
      onSelect(null);
      // Update parent with current new patient data
      if (newPatient.first_name && newPatient.last_name && newPatient.date_of_birth && newPatient.gender) {
        onNewPatientChange?.(newPatient);
      }
    } else {
      onNewPatientChange?.(null);
    }
  };

  const handleNewPatientChange = (field: keyof NewPatientData, value: string) => {
    const updated = { ...newPatient, [field]: value };
    setNewPatient(updated);
    
    // Only notify parent if required fields are filled
    if (updated.first_name && updated.last_name && updated.date_of_birth && updated.gender) {
      onNewPatientChange?.(updated);
    } else {
      onNewPatientChange?.(null);
    }
  };

  const handleSelectExisting = (patient: Patient) => {
    onSelect(patient);
    onNewPatientChange?.(null);
  };

  const isNewPatientValid = newPatient.first_name && newPatient.last_name && newPatient.date_of_birth && newPatient.gender;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="new" className="text-xs sm:text-sm">
          <UserPlus className="h-4 w-4 mr-2" />
          New Patient
        </TabsTrigger>
        <TabsTrigger value="existing" className="text-xs sm:text-sm">
          <User className="h-4 w-4 mr-2" />
          Existing Patient
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new_first_name" className="text-sm">First Name *</Label>
            <Input
              id="new_first_name"
              value={newPatient.first_name}
              onChange={(e) => handleNewPatientChange('first_name', e.target.value)}
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_last_name" className="text-sm">Last Name *</Label>
            <Input
              id="new_last_name"
              value={newPatient.last_name}
              onChange={(e) => handleNewPatientChange('last_name', e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new_dob" className="text-sm">Date of Birth *</Label>
            <Input
              id="new_dob"
              type="date"
              value={newPatient.date_of_birth}
              onChange={(e) => handleNewPatientChange('date_of_birth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_gender" className="text-sm">Gender *</Label>
            <Select 
              value={newPatient.gender} 
              onValueChange={(value) => handleNewPatientChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new_phone" className="text-sm">Phone</Label>
            <Input
              id="new_phone"
              type="tel"
              value={newPatient.phone}
              onChange={(e) => handleNewPatientChange('phone', e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_patient_id" className="text-sm">Patient ID</Label>
            <Input
              id="new_patient_id"
              value={newPatient.patient_id_number}
              onChange={(e) => handleNewPatientChange('patient_id_number', e.target.value)}
              placeholder="Optional ID"
            />
          </div>
        </div>

        {isNewPatientValid && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              ✓ Patient will be auto-registered when you save the report
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="existing" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredPatients?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patients found</p>
                    <p className="text-sm">Switch to "New Patient" tab to add one</p>
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
                      onClick={() => handleSelectExisting(patient)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm sm:text-base">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
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
                            className="text-xs sm:text-sm"
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
          </>
        )}
      </TabsContent>
    </Tabs>
  );
};
