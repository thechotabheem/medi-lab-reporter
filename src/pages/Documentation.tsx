import { useState } from 'react';
import { FileText, Download, Loader2, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { generatePRDPDF } from '@/lib/prd-pdf-generator.tsx';
import { EnhancedPageLayout } from '@/components/ui/enhanced-page-layout';

const Documentation = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { clinic } = useClinic();

  const handleDownloadPRD = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePRDPDF({
        clinic: clinic ? { name: clinic.name, logo_url: clinic.logo_url } : null,
      });
      
      const fileName = `MedLab-Reporter-PRD-${new Date().toISOString().split('T')[0]}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Product Requirements Document has been saved.',
      });
    } catch (error) {
      console.error('Error generating PRD PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sections = [
    { title: 'Executive Summary', desc: 'Application overview, target users, and value propositions' },
    { title: 'Technology Stack', desc: 'React 18, Vite, TailwindCSS, Lovable Cloud, @react-pdf/renderer' },
    { title: 'Core Modules', desc: 'Dashboard, Patient Management, Reports, Templates, Settings' },
    { title: 'Test Types (17)', desc: 'CBC, LFT, RFT, Lipid Profile, ESR, BSR, BSF, and more' },
    { title: 'Sequential ID System', desc: 'Patient IDs (PT-YY-NNNN) and Report Numbers (TYPE-MM-NNN)' },
    { title: 'Auto-Calculations', desc: 'BUN, Indirect Bilirubin, Globulin, LDL, VLDL formulas' },
    { title: 'Offline & PWA', desc: 'Offline-first operations, background sync, installable PWA' },
    { title: 'PDF Generation', desc: 'Branded reports with @react-pdf/renderer, professional layout' },
    { title: 'Security Model', desc: '5 managed accounts, RLS policies, admin reset protection' },
  ];

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Documentation"
        subtitle="Technical specifications and PRD"
        icon={<BookOpen className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Download Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Product Requirements Document</CardTitle>
                <CardDescription>
                  Complete technical blueprint for MedLab Reporter
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a comprehensive PDF containing all technical specifications, 
              database schemas, test type definitions, auto-calculation formulas, 
              and UI/UX guidelines. Perfect for offline reference or sharing with 
              technical stakeholders.
            </p>
            
            <Button
              onClick={handleDownloadPRD}
              disabled={isGenerating}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PRD PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Contents Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Contents</CardTitle>
            <CardDescription>
              The PRD PDF includes the following sections:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{section.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {section.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </EnhancedPageLayout>
  );
};

export default Documentation;
