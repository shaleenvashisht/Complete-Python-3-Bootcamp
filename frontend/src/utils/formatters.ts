import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format timestamp for display
export const formatTimestamp = (timestamp: string, formatStr: string = 'MMM dd, yyyy HH:mm:ss'): string => {
  try {
    return format(parseISO(timestamp), formatStr);
  } catch {
    return timestamp;
  }
};

// Format relative time
export const formatRelativeTime = (timestamp: string): string => {
  try {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  } catch {
    return timestamp;
  }
};

// Format duration in milliseconds
export const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  } else if (durationMs < 3600000) {
    return `${(durationMs / 60000).toFixed(1)}m`;
  } else {
    return `${(durationMs / 3600000).toFixed(1)}h`;
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format request source for display
export const formatRequestSource = (source: string): string => {
  return source
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Get log level color
export const getLogLevelColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'ERROR':
    case 'FATAL':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    case 'WARN':
    case 'WARNING':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'INFO':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    case 'DEBUG':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// Get status color
export const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'COMPLETE':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    case 'ERROR':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    case 'INCOMPLETE':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// Get source icon
export const getSourceIcon = (source: string): string => {
  switch (source) {
    case 'API_GATEWAY':
      return '🌐';
    case 'BATCH_JOB':
      return '⚙️';
    case 'SCHEDULER':
    case 'CRON':
      return '⏰';
    case 'USER_INTERFACE':
      return '👤';
    case 'WEBHOOK':
      return '🔗';
    case 'INTERNAL':
      return '🔧';
    default:
      return '❓';
  }
};