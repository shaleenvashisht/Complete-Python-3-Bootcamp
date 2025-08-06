import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { logAPI, handleAPIError } from '@/services/api';
import { useAppStore } from '@/stores/appStore';
import { formatFileSize } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface FileUploadProps {
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ className }) => {
  const { setData, setLoading, setError, loading } = useAppStore();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.log')) {
      setError('Only .txt and .log files are supported');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploadedFile(file);
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await logAPI.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show complete progress
      setTimeout(() => {
        setData(response.result);
        setLoading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      setError(handleAPIError(error));
      setLoading(false);
      setUploadProgress(0);
      setUploadedFile(null);
    }
  }, [setData, setLoading, setError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.log'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  const reset = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="border-2 border-dashed transition-colors duration-200">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all duration-200",
              isDragActive && !isDragReject && "scale-105",
              isDragReject && "scale-95"
            )}
          >
            <input {...getInputProps()} />
            
            <motion.div
              className={cn(
                "p-4 rounded-full transition-colors duration-200",
                isDragActive && !isDragReject && "bg-primary/10 text-primary",
                isDragReject && "bg-destructive/10 text-destructive",
                !isDragActive && "bg-muted text-muted-foreground"
              )}
              animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Upload className="h-8 w-8" />
            </motion.div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive
                  ? isDragReject
                    ? 'File type not supported'
                    : 'Drop your log file here'
                  : 'Upload Log File'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? isDragReject
                    ? 'Only .txt and .log files are supported'
                    : 'Release to upload'
                  : 'Drag and drop your .txt or .log file here, or click to browse'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 100MB
              </p>
            </div>

            {!loading && !uploadedFile && (
              <Button variant="outline" className="mt-4">
                Browse Files
              </Button>
            )}
          </div>

          <AnimatePresence>
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                  {loading && (
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">
                        {uploadProgress}%
                      </div>
                      <motion.div
                        className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                  {!loading && uploadProgress === 100 && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {!loading && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={reset}>
                      Upload Another
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};