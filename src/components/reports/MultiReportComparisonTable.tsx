import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { format } from 'date-fns';
import type { MultiComparisonResult, TrendType } from '@/hooks/useMultiReportComparison';

interface MultiReportComparisonTableProps {
  comparison: MultiComparisonResult[];
  reportDates: string[];
  uniqueFields?: Map<string, number[]>;
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
    <Badge variant={getVariant()} className="text-2xs font-medium whitespace-nowrap">
      <TrendIcon trend={trend} />
      <span className="ml-1">{getLabel()}</span>
    </Badge>
  );
};

const ValueCell = ({
  value,
  status,
}: {
  value: number | string | null;
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
    </span>
  );
};

// Mobile card view for a single comparison row
const ComparisonCard = ({
  item,
  reportDates,
}: {
  item: MultiComparisonResult;
  reportDates: string[];
}) => {
  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{item.fieldLabel}</p>
            <p className="text-xs text-muted-foreground">{item.normalRange}</p>
          </div>
          <TrendBadge trend={item.overallTrend} percentChange={item.percentChangeOverall} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {item.values.map((value, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {format(new Date(reportDates[idx]), 'MMM d, yy')}
              </p>
              <ValueCell value={value} status={item.statuses[idx]} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export function MultiReportComparisonTable({
  comparison,
  reportDates,
  uniqueFields,
}: MultiReportComparisonTableProps) {
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
    {} as Record<string, MultiComparisonResult[]>
  );

  if (comparison.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No comparable fields found across these reports.</p>
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
                reportDates={reportDates}
              />
            ))}
          </div>
        ))}

        {/* Unique fields section */}
        {uniqueFields && uniqueFields.size > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-orange-600">Fields not in all reports</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {[...uniqueFields.keys()].join(', ')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop table view with horizontal scroll
  return (
    <div className="space-y-6">
      {Object.entries(groupedComparison).map(([category, items]) => (
        <Card key={category} className="overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4">
            <CardTitle className="text-sm font-semibold">{category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">
                      Test Parameter
                    </TableHead>
                    {reportDates.map((date, idx) => (
                      <TableHead key={idx} className="text-center min-w-[90px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge variant="outline" className="text-2xs">
                            {idx + 1}
                          </Badge>
                          <span className="text-xs">{format(new Date(date), 'MMM d, yy')}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[100px]">Overall Trend</TableHead>
                    <TableHead className="text-right min-w-[90px]">Normal Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.fieldName}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {item.fieldLabel}
                        {item.unit && (
                          <span className="text-muted-foreground text-xs ml-1">({item.unit})</span>
                        )}
                      </TableCell>
                      {item.values.map((value, idx) => (
                        <TableCell key={idx} className="text-center">
                          <ValueCell value={value} status={item.statuses[idx]} />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <TrendBadge trend={item.overallTrend} percentChange={item.percentChangeOverall} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {item.normalRange}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      ))}

      {/* Unique fields info */}
      {uniqueFields && uniqueFields.size > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-orange-600">Fields not present in all reports</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {[...uniqueFields.entries()].map(([fieldName, indices]) => (
                <Badge key={fieldName} variant="outline" className="text-xs">
                  {fieldName}
                  <span className="ml-1 text-muted-foreground">
                    (Report{indices.length > 1 ? 's' : ''} {indices.map(i => i + 1).join(', ')})
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
