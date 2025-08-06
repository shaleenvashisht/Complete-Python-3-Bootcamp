import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileUpload } from '@/components/FileUpload';
import { DashboardSummary } from '@/components/DashboardSummary';
import { SearchFiltersComponent } from '@/components/SearchFilters';
import { RequestTimeline } from '@/components/RequestTimeline';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { 
    data, 
    loading, 
    error, 
    darkMode, 
    toggleDarkMode, 
    setError, 
    filteredLifecycles,
    reset 
  } = useAppStore();

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleReset = () => {
    reset();
  };

  const lifecycles = filteredLifecycles();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🔍</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  MicroTrace
                </h1>
                <p className="text-sm text-muted-foreground">
                  Distributed Log Analyzer
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {data && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="w-10 h-10 p-0"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">
                        Error occurred
                      </p>
                      <p className="text-sm text-destructive/80">
                        {error}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!data ? (
          /* Upload Screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl"
              >
                🔍
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Analyze Your Microservice Logs
                </h2>
                <p className="text-lg text-muted-foreground">
                  Upload distributed log files and visualize request lifecycles across services
                </p>
              </div>
            </div>

            <FileUpload />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <div className="text-2xl">📊</div>
                <h3 className="font-semibold">Smart Parsing</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically detects request IDs, service names, and timestamps
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <div className="text-2xl">🔄</div>
                <h3 className="font-semibold">Request Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Reconstructs complete request lifecycles across microservices
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <div className="text-2xl">⚡</div>
                <h3 className="font-semibold">Interactive Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Beautiful visualization with filtering and export capabilities
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* Dashboard Screen */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <DashboardSummary />
            
            <SearchFiltersComponent />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Request Lifecycles</h2>
                <div className="text-sm text-muted-foreground">
                  {lifecycles.length} request{lifecycles.length !== 1 ? 's' : ''}
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <div className="h-8 w-8 bg-muted rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : lifecycles.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or upload a different log file
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                >
                  {lifecycles.map((lifecycle, index) => (
                    <motion.div
                      key={`${lifecycle.request_id}-${lifecycle.external_order_id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <RequestTimeline lifecycle={lifecycle} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p>© 2024 MicroTrace. Built with React, TypeScript, and FastAPI.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span>Silicon Valley-grade developer productivity tool</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;