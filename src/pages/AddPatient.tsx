import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';
import { ageToDateOfBirth } from '@/lib/utils';
import { patientSchema } from '@/lib/validation-schemas';
import { enqueueAction } from '@/lib/offlineQueue';

export default function AddPatient() {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    phone: '',
    email: '',
    patient_id_number: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId) {
      toast({ title: 'Error', description: 'Clinic information not found.', variant: 'destructive' });
      return;
    }

    // Validate with Zod
    const result = patientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({ title: 'Validation Error', description: 'Please fix the highlighted fields.', variant: 'destructive' });
      return;
    }

    const validated = result.data;
    setIsSubmitting(true);

    const patientPayload = {
      clinic_id: clinicId,
      full_name: validated.full_name.trim(),
      date_of_birth: ageToDateOfBirth(parseInt(validated.age)),
      gender: validated.gender,
      phone: validated.phone?.trim() || null,
      email: validated.email?.trim() || null,
      patient_id_number: validated.patient_id_number?.trim() || null,
      address: validated.address?.trim() || null,
    };

    try {
      if (!navigator.onLine) {
        await enqueueAction('create-patient', patientPayload);
        toast({ title: 'Saved offline', description: `${validated.full_name} will sync when connected.` });
        navigate('/patients');
        return;
      }

      const { error } = await supabase.from('patients').insert(patientPayload);
      if (error) throw error;

      toast({ title: 'Patient added', description: `${validated.full_name} has been added.` });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/patients');
    } catch (error: any) {
      // Network error - enqueue offline
      if (!navigator.onLine || error?.message?.includes('fetch')) {
        await enqueueAction('create-patient', patientPayload);
        toast({ title: 'Saved offline', description: `${validated.full_name} will sync when connected.` });
        navigate('/patients');
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to add patient.', variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Add Patient"
        subtitle="Register a new patient"
        icon={<UserPlus className="h-5 w-5" />}
        showBack
        backPath="/patients"
      />
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          <FadeIn delay={100}>
            <Card className="animate-pulse-glow card-gradient-overlay">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Patient Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Fields marked with * are required
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="John Doe"
                      required
                      className={errors.full_name ? 'border-destructive' : ''}
                    />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                  </div>

                  {/* Age and Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm">Age (years) *</Label>
                      <Input
                        id="age"
                        type="number"
                        min="0"
                        max="150"
                        value={formData.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        placeholder="35"
                        required
                        className={errors.age ? 'border-destructive' : ''}
                      />
                      {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                        <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
                    </div>
                  </div>

                  {/* Patient ID */}
                  <div className="space-y-2">
                    <Label htmlFor="patient_id_number" className="text-sm">Patient ID Number</Label>
                    <Input
                      id="patient_id_number"
                      value={formData.patient_id_number}
                      onChange={(e) => handleChange('patient_id_number', e.target.value)}
                      placeholder="Optional unique identifier"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="patient@example.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Full address"
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 order-2 sm:order-1"
                      onClick={() => navigate('/patients')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 order-1 sm:order-2" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Patient
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
