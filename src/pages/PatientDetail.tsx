import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdatePatient, useDeletePatient } from '@/hooks/usePatientMutations';
import { usePatientReports } from '@/hooks/useReportMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Skeleton, SkeletonList, SkeletonForm } from '@/components/ui/skeleton';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
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
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  GitCompare,
  Save,
  X,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';
import { formatDate, formatDateFull } from '@/lib/date-formats';
import type { Patient, Gender } from '@/types/database';
import { getReportTypeName } from '@/lib/report-templates';
import { calculateAgeFromDOB, ageToDateOfBirth } from '@/lib/utils';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { useDataFreshness } from '@/hooks/useDataFreshness';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});
  const { dataSource, lastFetchedAt } = useDataFreshness('patient-' + id);

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
    enabled: !!id,
  });

  const { data: reports, isLoading: reportsLoading } = usePatientReports(id);

  const handleEdit = () => {
    if (patient) {
      setEditData({
        full_name: patient.full_name,
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
    await updatePatient.mutateAsync({ id: patient.id, ...editData } as any);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!patient?.id) return;
    await deletePatient.mutateAsync(patient.id);
    navigate('/patients');
  };

  if (isLoading) {
    return (
      <EnhancedPageLayout>
        <PageHeader title="Loading..." showBack backPath="/patients" />
        <HeaderDivider />
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="animate-pulse-glow">
                <CardHeader className="p-4 sm:p-6">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <SkeletonForm />
                </CardContent>
              </Card>
              <Card className="animate-pulse-glow">
                <CardHeader className="p-4 sm:p-6">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <SkeletonList count={3} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <Card className="animate-pulse-glow">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </EnhancedPageLayout>
    );
  }

  if (!patient) {
    return (
      <EnhancedPageLayout className="flex items-center justify-center">
        <EmptyState
          icon={User}
          title="Patient not found"
          description="The patient you're looking for doesn't exist or has been deleted."
          actionLabel="Back to Patients"
          onAction={() => navigate('/patients')}
        />
      </EnhancedPageLayout>
    );
  }

  return (
    <EnhancedPageLayout>
      <PageHeader
        title={patient.full_name}
        subtitle={patient.patient_id_number || 'No ID'}
        icon={<User className="h-5 w-5" />}
        showBack
        backPath="/patients"
        badge={<DataSourceBadge dataSource={dataSource} lastFetchedAt={lastFetchedAt} />}
        actions={
          !isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit} className="text-xs sm:text-sm">
                <Edit2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-xs sm:text-sm">
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {patient.full_name} and all their reports.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }
      />
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Patient Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <FadeIn delay={100}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Patient Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Personal and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label className="text-sm">Full Name</Label>
                            <Input value={editData.full_name || ''} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Age (years)</Label>
                            <Input 
                              type="number" 
                              min="0" 
                              max="150"
                              value={editData.date_of_birth ? calculateAgeFromDOB(editData.date_of_birth) : ''} 
                              onChange={(e) => {
                                const age = parseInt(e.target.value) || 0;
                                setEditData({ ...editData, date_of_birth: ageToDateOfBirth(age) });
                              }} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Gender</Label>
                            <Select value={editData.gender} onValueChange={(value: Gender) => setEditData({ ...editData, gender: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Patient ID</Label>
                            <Input value={editData.patient_id_number || ''} onChange={(e) => setEditData({ ...editData, patient_id_number: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Phone</Label>
                            <Input value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label className="text-sm">Email</Label>
                            <Input type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label className="text-sm">Address</Label>
                            <Textarea value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} rows={2} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSave} disabled={updatePatient.isPending} size="sm">
                            {updatePatient.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4 mr-2" />Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Date of Birth</p>
                            <p className="text-sm font-medium">{formatDateFull(patient.date_of_birth)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                          <div>
                            <p className="text-xs text-muted-foreground">Gender</p>
                            <p className="text-sm font-medium capitalize">{patient.gender}</p>
                          </div>
                        </div>
                        {patient.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium truncate">{patient.phone}</p>
                            </div>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium truncate">{patient.email}</p>
                            </div>
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
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
              </FadeIn>

              {/* Reports History */}
              <FadeIn delay={200}>
                <Card className="animate-pulse-glow card-gradient-overlay">
                  <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Report History</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{reports?.length || 0} reports found</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(reports?.filter(r => r.status === 'completed').length ?? 0) >= 2 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/patients/${id}/compare`)}
                          className="text-xs sm:text-sm"
                        >
                          <GitCompare className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            Compare ({reports?.filter(r => r.status === 'completed').length})
                          </span>
                        </Button>
                      )}
                      <Button size="sm" onClick={() => navigate('/reports/new')} className="text-xs sm:text-sm">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Report</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {reportsLoading ? (
                      <SkeletonList count={3} />
                    ) : reports?.length === 0 ? (
                      <div className="text-center py-8">
                        <IconWrapper variant="muted" size="lg" className="mx-auto mb-3">
                          <FileText className="h-6 w-6" />
                        </IconWrapper>
                        <p className="text-muted-foreground text-sm">No reports yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {reports?.map((report, index) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 transition-all duration-300 cursor-pointer group animate-fade-in-up hover:scale-[1.01]"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <IconWrapper size="default" className="shrink-0 transition-all duration-300 group-hover:scale-110">
                                <FileText className="h-4 w-4 transition-all duration-300 group-hover:text-primary" />
                              </IconWrapper>
                              <div className="min-w-0">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                  {getReportTypeName(report.report_type)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {report.report_number} • {formatDate(report.test_date)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                report.status === 'completed' ? 'default' : report.status === 'verified' ? 'secondary' : 'outline'
                              }
                              className="text-2xs shrink-0"
                            >
                              {report.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <FadeIn delay={300}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Button className="w-full" onClick={() => navigate('/reports/new')} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Report
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={400}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-sm sm:text-base">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Total Reports</span>
                      <span className="text-xs sm:text-sm font-medium">{reports?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Completed</span>
                      <span className="text-xs sm:text-sm font-medium">{reports?.filter((r) => r.status === 'completed').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Drafts</span>
                      <span className="text-xs sm:text-sm font-medium">{reports?.filter((r) => r.status === 'draft').length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
