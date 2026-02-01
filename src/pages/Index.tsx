import { EnhancedPageLayout } from '@/components/ui/enhanced-page-layout';

const Index = () => {
  return (
    <EnhancedPageLayout className="flex items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </EnhancedPageLayout>
  );
};

export default Index;
