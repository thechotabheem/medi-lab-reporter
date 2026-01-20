import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  ArrowLeft,
  Search,
  Plus,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { getReportTypeName } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';

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
      report.patient?.first_name?.toLowerCase().includes(searchLower) ||
      report.patient?.last_name?.toLowerCase().includes(searchLower) ||
      report.referring_doctor?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.report_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Reports</h1>
              <p className="text-xs text-muted-foreground">View and manage lab reports</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blood_test">Blood Test</SelectItem>
              <SelectItem value="urine_analysis">Urine Analysis</SelectItem>
              <SelectItem value="hormone_immunology">Hormone & Immunology</SelectItem>
              <SelectItem value="microbiology">Microbiology</SelectItem>
              <SelectItem value="ultrasound">Ultrasound</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/reports/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredReports?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No reports found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first report to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => navigate('/reports/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports?.map((report) => (
              <Card
                key={report.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
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
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {report.patient?.first_name} {report.patient?.last_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.test_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{report.report_number}</p>
                      <p className="text-xs text-muted-foreground">
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
    </div>
  );
}
