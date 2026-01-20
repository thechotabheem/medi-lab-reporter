import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdatePatient, useDeletePatient } from '@/hooks/usePatientMutations';
import { usePatientReports } from '@/hooks/useReportMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FlaskConical,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Patient, Gender } from '@/types/database';
import { getReportTypeName } from '@/lib/report-templates';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});

  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id && !!profile?.clinic_id,
  });

  const { data: reports, isLoading: reportsLoading } = usePatientReports(id);

  const handleEdit = () => {
    if (patient) {
      setEditData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        patient_id_number: patient.patient_id_number || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    await updatePatient.mutateAsync({
      id: patient.id,
      ...editData,
    } as any);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!patient?.id) return;
    await deletePatient.mutateAsync(patient.id);
    navigate('/patients');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Patient not found</p>
            <Button onClick={() => navigate('/patients')} className="mt-4">
              Back to Patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {patient.patient_id_number || 'No ID'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {patient.first_name} {patient.last_name} and all their reports. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patient Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Personal and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={editData.first_name || ''}
                          onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={editData.last_name || ''}
                          onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={editData.date_of_birth || ''}
                          onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={editData.gender}
                          onValueChange={(value: Gender) => setEditData({ ...editData, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Patient ID</Label>
                        <Input
                          value={editData.patient_id_number || ''}
                          onChange={(e) => setEditData({ ...editData, patient_id_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          value={editData.address || ''}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={updatePatient.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-medium">
                          {format(new Date(patient.date_of_birth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium capitalize">{patient.gender}</p>
                      </div>
                    </div>
                    {patient.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{patient.phone}</p>
                        </div>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{patient.email}</p>
                        </div>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">{patient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>{reports?.length || 0} reports found</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate('/reports/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : reports?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports?.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {getReportTypeName(report.report_type)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.report_number} • {format(new Date(report.test_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            report.status === 'completed'
                              ? 'default'
                              : report.status === 'verified'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => navigate('/reports/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Reports</span>
                  <span className="text-sm font-medium">{reports?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium">
                    {reports?.filter((r) => r.status === 'completed').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Drafts</span>
                  <span className="text-sm font-medium">
                    {reports?.filter((r) => r.status === 'draft').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
