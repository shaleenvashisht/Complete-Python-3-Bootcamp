import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RequestLifecycle, LogEntry } from '@/types';
import { 
  formatTimestamp, 
  formatDuration, 
  formatRequestSource, 
  getLogLevelColor, 
  getStatusColor, 
  getSourceIcon,
  truncateText 
} from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface RequestTimelineProps {
  lifecycle: RequestLifecycle;
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

interface LogEventProps {
  event: LogEntry;
  index: number;
  isLast: boolean;
}

const LogEvent: React.FC<LogEventProps> = ({ event, index, isLast }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getEventIcon = () => {
    switch (event.log_level) {
      case 'ERROR':
      case 'FATAL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-6 top-8 w-0.5 h-16 bg-gradient-to-b from-primary to-purple-500 opacity-30" />
      )}
      
      <div className="flex items-start space-x-4 group">
        {/* Event icon */}
        <motion.div
          className="flex-shrink-0 mt-1 p-2 rounded-full bg-background border-2 border-primary/20 shadow-sm"
          whileHover={{ scale: 1.1 }}
        >
          {getEventIcon()}
        </motion.div>

        {/* Event content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getLogLevelColor(event.log_level))}>
                {event.log_level}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {event.service_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(event.timestamp, 'HH:mm:ss.SSS')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-sm">
              {truncateText(event.message, showDetails ? 500 : 100)}
            </p>
            {event.event_name && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                  {event.event_name}
                </span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t"
              >
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">Line:</span>
                    <span className="ml-2">{event.line_number}</span>
                  </div>
                  {event.request_id && (
                    <div>
                      <span className="font-medium text-muted-foreground">Request ID:</span>
                      <span className="ml-2 font-mono">{truncateText(event.request_id, 20)}</span>
                    </div>
                  )}
                  {event.external_order_id && (
                    <div>
                      <span className="font-medium text-muted-foreground">Order ID:</span>
                      <span className="ml-2 font-mono">{truncateText(event.external_order_id, 20)}</span>
                    </div>
                  )}
                  {event.source && (
                    <div>
                      <span className="font-medium text-muted-foreground">Source:</span>
                      <span className="ml-2">{event.source}</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-xs font-medium text-muted-foreground">Raw Log:</span>
                  <pre className="text-xs mt-1 whitespace-pre-wrap break-all">
                    {event.raw_line}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ 
  lifecycle, 
  className, 
  expanded = false, 
  onToggle 
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  const getStatusIcon = () => {
    switch (lifecycle.status) {
      case 'COMPLETE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'INCOMPLETE':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={cn("transition-all duration-200", className)} hover>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getSourceIcon(lifecycle.source)}</div>
            <div>
              <CardTitle className="text-lg">
                {lifecycle.request_id || lifecycle.external_order_id || 'Unknown Request'}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-muted-foreground">
                  {formatRequestSource(lifecycle.source)}
                </span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(lifecycle.status))}>
                  {lifecycle.status}
                </span>
                {lifecycle.duration_ms && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(lifecycle.duration_ms)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="ml-2"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>{lifecycle.events.length} events</span>
            <span>{lifecycle.services.length} services: {lifecycle.services.join(', ')}</span>
            {lifecycle.has_errors && (
              <span className="text-red-500 font-medium">
                {lifecycle.error_count} error{lifecycle.error_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(lifecycle.start_time)}
            {lifecycle.end_time && (
              <span> → {formatTimestamp(lifecycle.end_time)}</span>
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-0">
              <div className="space-y-6">
                {lifecycle.events.map((event, index) => (
                  <LogEvent
                    key={`${event.line_number}-${index}`}
                    event={event}
                    index={index}
                    isLast={index === lifecycle.events.length - 1}
                  />
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};