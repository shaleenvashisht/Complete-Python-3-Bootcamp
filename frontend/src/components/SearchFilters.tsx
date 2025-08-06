import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/stores/appStore';
import { SearchFilters } from '@/types';
import { cn } from '@/utils/cn';

interface SearchFiltersProps {
  className?: string;
}

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({ className }) => {
  const { filters, setFilters, clearFilters, data, filteredLifecycles } = useAppStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    clearFilters();
  };

  const exportData = async (format: 'json' | 'csv') => {
    if (!data) return;
    
    const exportData = {
      summary: {
        total_requests: filteredLifecycles().length,
        export_timestamp: new Date().toISOString(),
        filters_applied: filters,
      },
      lifecycles: filteredLifecycles(),
    };

    const dataStr = format === 'json' 
      ? JSON.stringify(exportData, null, 2)
      : convertToCSV(filteredLifecycles());
    
    const blob = new Blob([dataStr], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `microtrace_export_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (lifecycles: any[]) => {
    const headers = [
      'Request ID',
      'External Order ID',
      'Source',
      'Status',
      'Start Time',
      'End Time',
      'Duration (ms)',
      'Services',
      'Event Count',
      'Error Count',
    ];

    const rows = lifecycles.map(lifecycle => [
      lifecycle.request_id || '',
      lifecycle.external_order_id || '',
      lifecycle.source,
      lifecycle.status,
      lifecycle.start_time,
      lifecycle.end_time || '',
      lifecycle.duration_ms || '',
      lifecycle.services.join('; '),
      lifecycle.events.length,
      lifecycle.error_count,
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== '' && v !== null
  ).length;

  if (!data) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Request ID, Order ID, or Service..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                value={localFilters.requestId || ''}
                onChange={(e) => handleFilterChange('requestId', e.target.value)}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors"
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Status</option>
                <option value="COMPLETE">Complete</option>
                <option value="ERROR">Error</option>
                <option value="INCOMPLETE">Incomplete</option>
              </select>

              <select
                className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors"
                value={localFilters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
              >
                <option value="">All Sources</option>
                <option value="API_GATEWAY">API Gateway</option>
                <option value="BATCH_JOB">Batch Job</option>
                <option value="SCHEDULER">Scheduler</option>
                <option value="CRON">Cron</option>
                <option value="USER_INTERFACE">User Interface</option>
                <option value="WEBHOOK">Webhook</option>
                <option value="INTERNAL">Internal</option>
              </select>

              <select
                className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors"
                value={localFilters.serviceName || ''}
                onChange={(e) => handleFilterChange('serviceName', e.target.value || undefined)}
              >
                <option value="">All Services</option>
                {data.services.map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(showAdvanced && "bg-accent")}
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}

              <div className="relative group">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2 space-y-1 min-w-[120px]">
                    <button
                      onClick={() => exportData('json')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => exportData('csv')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded transition-colors"
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">External Order ID</label>
                    <input
                      type="text"
                      placeholder="Filter by Order ID..."
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors"
                      value={localFilters.externalOrderId || ''}
                      onChange={(e) => handleFilterChange('externalOrderId', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Has Errors</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors"
                      value={localFilters.hasErrors?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleFilterChange('hasErrors', value === '' ? undefined : value === 'true');
                      }}
                    >
                      <option value="">All Requests</option>
                      <option value="true">With Errors</option>
                      <option value="false">Without Errors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Date Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="datetime-local"
                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors text-sm"
                        value={localFilters.dateRange?.start?.toISOString().slice(0, 16) || ''}
                        onChange={(e) => {
                          const startDate = e.target.value ? new Date(e.target.value) : undefined;
                          handleFilterChange('dateRange', {
                            start: startDate,
                            end: localFilters.dateRange?.end || new Date(),
                          });
                        }}
                      />
                      <input
                        type="datetime-local"
                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring transition-colors text-sm"
                        value={localFilters.dateRange?.end?.toISOString().slice(0, 16) || ''}
                        onChange={(e) => {
                          const endDate = e.target.value ? new Date(e.target.value) : undefined;
                          handleFilterChange('dateRange', {
                            start: localFilters.dateRange?.start || new Date(),
                            end: endDate,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
            <span>
              Showing {filteredLifecycles().length} of {data.lifecycles.length} requests
              {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied)`}
            </span>
            
            <div className="flex items-center space-x-4">
              <span>{data.services.length} services</span>
              <span>{data.parsed_lines.toLocaleString()} log lines processed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};