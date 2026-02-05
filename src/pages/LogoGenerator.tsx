import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Download, RefreshCw, Check, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type LogoStyle = 'default' | 'monogram' | 'abstract' | 'mother-child';

interface GeneratedLogo {
  imageUrl: string;
  style: LogoStyle;
  description?: string;
}

export default function LogoGenerator() {
  const [selectedStyle, setSelectedStyle] = useState<LogoStyle>('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<GeneratedLogo | null>(null);
  const [previewBackground, setPreviewBackground] = useState<'dark' | 'light'>('dark');

  const styles: { value: LogoStyle; label: string; description: string }[] = [
    { value: 'default', label: 'Medical + Maternity', description: 'Mother & child with medical elements' },
    { value: 'monogram', label: 'Monogram', description: 'Stylized "Z" letterform' },
    { value: 'abstract', label: 'Abstract', description: 'Geometric protective shape' },
    { value: 'mother-child', label: 'Silhouette', description: 'Elegant mother-child embrace' },
  ];

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-logo', {
        body: { style: selectedStyle }
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate logo');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newLogo: GeneratedLogo = {
        imageUrl: data.imageUrl,
        style: data.style,
        description: data.description
      };

      setGeneratedLogos(prev => [newLogo, ...prev]);
      setSelectedLogo(newLogo);
      toast.success('Logo generated successfully!');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to connect to AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = (logo: GeneratedLogo) => {
    const link = document.createElement('a');
    link.href = logo.imageUrl;
    link.download = `zia-clinic-logo-${logo.style}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo downloaded!');
  };

  const selectAsAppLogo = async (logo: GeneratedLogo) => {
    // For now, just download it - user can manually replace public/icon.svg
    downloadLogo(logo);
    toast.info('Logo downloaded! Replace public/icon.svg with this file to use as app icon.');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Logo Generator"
        subtitle="AI-powered logo design for Zia Clinic"
        icon={<Palette className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Style Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Style</CardTitle>
            <CardDescription>Select a design direction for your logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={selectedStyle}
              onValueChange={(v) => setSelectedStyle(v as LogoStyle)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {styles.map((style) => (
                <div key={style.value} className="relative">
                  <RadioGroupItem
                    value={style.value}
                    id={style.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={style.value}
                    className={cn(
                      "flex flex-col gap-1 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "hover:border-primary/50 hover:bg-accent/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <span className="font-medium">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button
              onClick={generateLogo}
              disabled={isGenerating}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Logo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Area */}
        {selectedLogo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <CardDescription>Selected logo preview</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={previewBackground === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewBackground('dark')}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={previewBackground === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewBackground('light')}
                  >
                    Light
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "flex items-center justify-center p-8 rounded-lg transition-colors",
                  previewBackground === 'dark' ? 'bg-[#090a0d]' : 'bg-white border'
                )}
              >
                <img
                  src={selectedLogo.imageUrl}
                  alt="Generated logo"
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </div>
              
              {/* Size previews */}
              <div className="mt-4 flex items-center gap-4 justify-center">
                <div className="text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-lg flex items-center justify-center mb-1",
                    previewBackground === 'dark' ? 'bg-[#090a0d]' : 'bg-white border'
                  )}>
                    <img src={selectedLogo.imageUrl} alt="" className="w-12 h-12 object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">48px</span>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-1",
                    previewBackground === 'dark' ? 'bg-[#090a0d]' : 'bg-white border'
                  )}>
                    <img src={selectedLogo.imageUrl} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">32px</span>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center mb-1",
                    previewBackground === 'dark' ? 'bg-[#090a0d]' : 'bg-white border'
                  )}>
                    <img src={selectedLogo.imageUrl} alt="" className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">16px</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <Button variant="outline" onClick={() => downloadLogo(selectedLogo)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => selectAsAppLogo(selectedLogo)}>
                  <Check className="h-4 w-4 mr-2" />
                  Use as App Logo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Logos Gallery */}
        {generatedLogos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Logos</CardTitle>
              <CardDescription>Click to select, generate more to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {generatedLogos.map((logo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedLogo(logo)}
                    className={cn(
                      "relative aspect-square rounded-lg border-2 p-2 transition-all",
                      "hover:border-primary/50",
                      selectedLogo === logo ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                  >
                    <img
                      src={logo.imageUrl}
                      alt={`Logo variant ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-background/80 px-1 rounded">
                      {logo.style}
                    </span>
                    {selectedLogo === logo && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {generatedLogos.length === 0 && !isGenerating && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">No logos generated yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a style above and click "Generate Logo" to create AI-powered logo designs
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
