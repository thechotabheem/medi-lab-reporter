import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { getReportTypeName } from '@/lib/report-templates';
import { exportToCSV } from '@/lib/csv-export';
import { toast } from 'sonner';

export default function Reports() {
  const navigate = useNavigate();
  const { data: reports, isLoading } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredReports = reports?.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      report.report_number.toLowerCase().includes(searchLower) ||
      report.patient?.full_name?.toLowerCase().includes(searchLower) ||
      report.referring_doctor?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleExportCSV = () => {
    if (!filteredReports?.length) return;
    exportToCSV(
      filteredReports.map((r) => ({
        report_number: r.report_number,
        patient: r.patient?.full_name || '',
        type: getReportTypeName(r.report_type),
        status: r.status,
        test_date: format(new Date(r.test_date), 'yyyy-MM-dd'),
        referring_doctor: r.referring_doctor || '',
      })),
      [
        { key: 'report_number', label: 'Report #' },
        { key: 'patient', label: 'Patient Name' },
        { key: 'type', label: 'Report Type' },
        { key: 'status', label: 'Status' },
        { key: 'test_date', label: 'Test Date' },
        { key: 'referring_doctor', label: 'Referring Doctor' },
      ],
      `reports-export-${new Date().toISOString().split('T')[0]}`
    );
    toast.success('Reports exported to CSV');
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Reports"
        subtitle={`View and manage lab reports${reports?.length ? ` (${reports.length})` : ''}`}
        icon={<ClipboardList className="h-5 w-5" />}
        showBack
        backPath="/dashboard"
      />
      
      <HeaderDivider />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cbc">CBC</SelectItem>
                  <SelectItem value="lft">LFT</SelectItem>
                  <SelectItem value="rft">RFT</SelectItem>
                  <SelectItem value="lipid_profile">Lipid Profile</SelectItem>
                  <SelectItem value="esr">ESR</SelectItem>
                  <SelectItem value="bsr">BSR</SelectItem>
                  <SelectItem value="bsf">BSF</SelectItem>
                  <SelectItem value="serum_calcium">Serum Calcium</SelectItem>
                  <SelectItem value="mp">MP</SelectItem>
                  <SelectItem value="typhoid">Typhoid</SelectItem>
                  <SelectItem value="hcv">HCV</SelectItem>
                  <SelectItem value="hbsag">HBsAg</SelectItem>
                  <SelectItem value="hiv">HIV</SelectItem>
                  <SelectItem value="vdrl">VDRL</SelectItem>
                  <SelectItem value="h_pylori">H. Pylori</SelectItem>
                  <SelectItem value="blood_group">Blood Group</SelectItem>
                  <SelectItem value="ra_factor">R.A Factor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 sm:self-end">
            {filteredReports && filteredReports.length > 0 && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button onClick={() => navigate('/reports/new')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 sm:h-24 skeleton rounded-lg animate-pulse-glow" />
            ))}
          </div>
        ) : filteredReports?.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description={
              searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first report to get started'
            }
            actionLabel={!searchTerm && statusFilter === 'all' && typeFilter === 'all' ? 'Create Report' : undefined}
            onAction={!searchTerm && statusFilter === 'all' && typeFilter === 'all' ? () => navigate('/reports/new') : undefined}
          />
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredReports?.map((report, index) => (
              <Card
                key={report.id}
                className="group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:scale-[1.01] animate-fade-in-up animate-pulse-glow card-gradient-overlay"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => navigate(`/reports/${report.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`${getReportTypeName(report.report_type)} for ${report.patient?.full_name}, ${report.status}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/reports/${report.id}`); } }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <IconWrapper size="lg" className="shrink-0 hidden sm:flex transition-all duration-300 group-hover:scale-110">
                        <FileText className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
                      </IconWrapper>
                      <IconWrapper size="default" className="shrink-0 flex sm:hidden">
                        <FileText className="h-4 w-4 transition-all duration-300 group-hover:text-primary" />
                      </IconWrapper>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                            {getReportTypeName(report.report_type)}
                          </h3>
                          <Badge
                            variant={
                              report.status === 'completed'
                                ? 'default'
                                : report.status === 'verified'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-2xs sm:text-xs"
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-2xs sm:text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {report.patient?.full_name}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                            {format(new Date(report.test_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden md:block shrink-0">
                      <p className="text-xs sm:text-sm font-medium">{report.report_number}</p>
                      <p className="text-2xs sm:text-xs text-muted-foreground truncate max-w-[150px]">
                        {report.referring_doctor || 'No referring doctor'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </EnhancedPageLayout>
  );
}
