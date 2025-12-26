import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';

const clinicSchema = z.object({
  name: z.string().min(2, 'Clinic name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

type ClinicFormData = z.infer<typeof clinicSchema>;

interface ClinicRegistrationFormProps {
  userData: { fullName: string; phone?: string };
  onSuccess: () => void;
}

export const ClinicRegistrationForm = ({ userData, onSuccess }: ClinicRegistrationFormProps) => {
  const { createClinicAndProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
  });

  const onSubmit = async (data: ClinicFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await createClinicAndProfile(
      {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || undefined,
      },
      userData
    );

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Register Your Clinic</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Set up your clinic to start creating reports
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="clinicName">Clinic Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="clinicName"
              placeholder="City Medical Laboratory"
              className="pl-10"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinicAddress">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="clinicAddress"
              placeholder="123 Medical Center Drive, Suite 100"
              className="pl-10 min-h-[80px]"
              {...register('address')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clinicPhone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clinicPhone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="pl-10"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicEmail">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clinicEmail"
                type="email"
                placeholder="contact@clinic.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating clinic...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
