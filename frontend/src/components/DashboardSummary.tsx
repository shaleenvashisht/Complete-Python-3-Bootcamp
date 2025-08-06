import { motion } from 'framer-motion';
import { BarChart, TrendingUp, Activity, AlertTriangle, CheckCircle, Clock, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAppStore } from '@/stores/appStore';
import { formatDuration } from '@/utils/formatters';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp 
                className={`h-3 w-3 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} 
              />
              <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const DashboardSummary: React.FC = () => {
  const { data, summary } = useAppStore();
  const metrics = summary();

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const successRate = metrics.totalRequests > 0 
    ? ((metrics.completedRequests / metrics.totalRequests) * 100).toFixed(1)
    : '0';

  const errorRate = metrics.totalRequests > 0 
    ? ((metrics.errorRequests / metrics.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          subtitle="Tracked request lifecycles"
          icon={<Activity className="h-4 w-4" />}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${metrics.completedRequests} completed requests`}
          icon={<CheckCircle className="h-4 w-4" />}
          color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${errorRate}%`}
          subtitle={`${metrics.errorRequests} requests with errors`}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
        
        <MetricCard
          title="Avg Duration"
          value={formatDuration(metrics.avgDuration)}
          subtitle="Average request completion time"
          icon={<Clock className="h-4 w-4" />}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Services</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.servicesCount}</div>
            <div className="space-y-1">
              {data.services.slice(0, 5).map((service, index) => (
                <div key={service} className="flex items-center justify-between text-sm">
                  <span className="truncate">{service}</span>
                  <span className="text-muted-foreground">
                    {data.lifecycles.filter(l => l.services.includes(service)).length}
                  </span>
                </div>
              ))}
              {data.services.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{data.services.length - 5} more services
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="h-5 w-5" />
              <span>Processing Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Lines</span>
                <span className="font-mono">{data.total_lines.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Parsed Lines</span>
                <span className="font-mono">{data.parsed_lines.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Skipped Lines</span>
                <span className="font-mono">{data.skipped_lines.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Parse Rate</span>
                <span className="font-mono">
                  {((data.parsed_lines / data.total_lines) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {data.time_range.start && (
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <div className="font-mono text-xs">
                    {new Date(data.time_range.start).toLocaleString()}
                  </div>
                </div>
              )}
              {data.time_range.end && (
                <div>
                  <span className="text-muted-foreground">To:</span>
                  <div className="font-mono text-xs">
                    {new Date(data.time_range.end).toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Processing Time:</span>
                <div className="font-mono text-xs">
                  {data.processing_time_ms}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};