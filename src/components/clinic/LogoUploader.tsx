import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploaderProps {
  currentLogoUrl: string;
  onLogoChange: (url: string) => void;
  clinicId: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function LogoUploader({ currentLogoUrl, onLogoChange, clinicId }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPG, or WEBP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/clinic-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('clinic-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(fileName);

      onLogoChange(urlData.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload logo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [currentLogoUrl, clinicId]);

  const handleRemove = async () => {
    if (!currentLogoUrl) return;
    
    setIsUploading(true);
    try {
      const path = currentLogoUrl.split('/clinic-logos/')[1];
      if (path) {
        await supabase.storage.from('clinic-logos').remove([path]);
      }
      onLogoChange('');
      toast.success('Logo removed');
    } catch (err: any) {
      toast.error('Failed to remove logo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {currentLogoUrl ? (
        <div className="flex items-start gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-muted/30">
              <img
                src={currentLogoUrl}
                alt="Clinic logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">Current logo</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/30',
            isUploading && 'cursor-not-allowed opacity-50'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Drop logo here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP (max 2MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
