import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Trash2,
} from 'lucide-react';
import type { ComparisonResult, TrendType } from '@/hooks/useReportComparison';

interface ReportComparisonTableProps {
  comparison: ComparisonResult[];
  uniqueToA?: string[];
  uniqueToB?: string[];
  reportALabel?: string;
  reportBLabel?: string;
}

const TrendIcon = ({ trend }: { trend: TrendType }) => {
  switch (trend) {
    case 'improved':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'declined':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    case 'stable':
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    case 'new':
      return <Star className="h-4 w-4 text-blue-500" />;
    case 'removed':
      return <Trash2 className="h-4 w-4 text-orange-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const TrendBadge = ({ trend, percentChange }: { trend: TrendType; percentChange: number | null }) => {
  const getVariant = (): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (trend) {
      case 'improved':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'new':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getLabel = (): string => {
    switch (trend) {
      case 'improved':
        return percentChange !== null ? `+${percentChange.toFixed(1)}%` : 'Improved';
      case 'declined':
        return percentChange !== null ? `${percentChange.toFixed(1)}%` : 'Declined';
      case 'stable':
        return 'Stable';
      case 'new':
        return 'New';
      case 'removed':
        return 'Removed';
      default:
        return '-';
    }
  };

  return (
    <Badge variant={getVariant()} className="text-2xs font-medium">
      <TrendIcon trend={trend} />
      <span className="ml-1">{getLabel()}</span>
    </Badge>
  );
};

const ValueCell = ({
  value,
  unit,
  status,
}: {
  value: number | string | null;
  unit: string;
  status: 'normal' | 'abnormal' | 'unknown';
}) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span
      className={cn(
        'font-medium',
        status === 'abnormal' && 'text-destructive font-bold',
        status === 'normal' && 'text-foreground'
      )}
    >
      {value}
      {unit && <span className="text-muted-foreground text-xs ml-1">{unit}</span>}
    </span>
  );
};

// Mobile card view for a single comparison row
const ComparisonCard = ({
  item,
  reportALabel,
  reportBLabel,
}: {
  item: ComparisonResult;
  reportALabel: string;
  reportBLabel: string;
}) => {
  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{item.fieldLabel}</p>
            <p className="text-xs text-muted-foreground">{item.normalRange}</p>
          </div>
          <TrendBadge trend={item.trend} percentChange={item.percentChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{reportALabel}</p>
            <ValueCell value={item.valueA} unit={item.unit} status={item.statusA} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{reportBLabel}</p>
            <ValueCell value={item.valueB} unit={item.unit} status={item.statusB} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ReportComparisonTable({
  comparison,
  uniqueToA = [],
  uniqueToB = [],
  reportALabel = 'Baseline',
  reportBLabel = 'Current',
}: ReportComparisonTableProps) {
  const isMobile = useIsMobile();

  // Group by category
  const groupedComparison = comparison.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ComparisonResult[]>
  );

  if (comparison.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No comparable fields found between these reports.</p>
        </CardContent>
      </Card>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {Object.entries(groupedComparison).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide px-1">
              {category}
            </h3>
            {items.map((item) => (
              <ComparisonCard
                key={item.fieldName}
                item={item}
                reportALabel={reportALabel}
                reportBLabel={reportBLabel}
              />
            ))}
          </div>
        ))}

        {/* Unique fields sections */}
        {uniqueToA.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-orange-600">Only in {reportALabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">{uniqueToA.join(', ')}</p>
            </CardContent>
          </Card>
        )}
        {uniqueToB.length > 0 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-blue-600">Only in {reportBLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">{uniqueToB.join(', ')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="space-y-6">
      {Object.entries(groupedComparison).map(([category, items]) => (
        <Card key={category} className="overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4">
            <CardTitle className="text-sm font-semibold">{category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Test Parameter</TableHead>
                  <TableHead className="text-right">{reportALabel}</TableHead>
                  <TableHead className="text-right">{reportBLabel}</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead className="text-right">Normal Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.fieldName}>
                    <TableCell className="font-medium">
                      {item.fieldLabel}
                      {item.unit && (
                        <span className="text-muted-foreground text-xs ml-1">({item.unit})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ValueCell value={item.valueA} unit="" status={item.statusA} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ValueCell value={item.valueB} unit="" status={item.statusB} />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.absoluteChange !== null ? (
                        <span
                          className={cn(
                            'text-sm',
                            item.absoluteChange > 0 && 'text-emerald-600',
                            item.absoluteChange < 0 && 'text-destructive'
                          )}
                        >
                          {item.absoluteChange > 0 ? '+' : ''}
                          {item.absoluteChange.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendBadge trend={item.trend} percentChange={item.percentChange} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {item.normalRange}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Unique fields info */}
      {(uniqueToA.length > 0 || uniqueToB.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {uniqueToA.length > 0 && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-orange-600">Only in {reportALabel}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{uniqueToA.join(', ')}</p>
              </CardContent>
            </Card>
          )}
          {uniqueToB.length > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-blue-600">Only in {reportBLabel}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{uniqueToB.join(', ')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}