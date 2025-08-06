import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, ParsedLogsResponse, RequestLifecycle, SearchFilters } from '@/types';

interface AppStore extends AppState {
  // Actions
  setData: (data: ParsedLogsResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  toggleDarkMode: () => void;
  setSelectedLifecycle: (lifecycle: RequestLifecycle | null) => void;
  reset: () => void;
  
  // Computed values
  filteredLifecycles: () => RequestLifecycle[];
  summary: () => {
    totalRequests: number;
    completedRequests: number;
    errorRequests: number;
    avgDuration: number;
    servicesCount: number;
  };
}

const initialState: AppState = {
  data: null,
  loading: false,
  error: null,
  filters: {},
  darkMode: false,
  selectedLifecycle: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setData: (data) => set({ data, error: null }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error, loading: false }),
      
      setFilters: (newFilters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...newFilters } 
        })),
      
      clearFilters: () => set({ filters: {} }),
      
      toggleDarkMode: () => 
        set((state) => ({ darkMode: !state.darkMode })),
      
      setSelectedLifecycle: (lifecycle) => 
        set({ selectedLifecycle: lifecycle }),
      
      reset: () => set(initialState),

      // Computed values
      filteredLifecycles: () => {
        const { data, filters } = get();
        if (!data) return [];

        return data.lifecycles.filter((lifecycle) => {
          // Filter by request ID
          if (filters.requestId && !lifecycle.request_id?.includes(filters.requestId)) {
            return false;
          }

          // Filter by external order ID
          if (filters.externalOrderId && !lifecycle.external_order_id?.includes(filters.externalOrderId)) {
            return false;
          }

          // Filter by service name
          if (filters.serviceName && !lifecycle.services.some(service => 
            service.toLowerCase().includes(filters.serviceName!.toLowerCase())
          )) {
            return false;
          }

          // Filter by status
          if (filters.status && lifecycle.status !== filters.status) {
            return false;
          }

          // Filter by source
          if (filters.source && lifecycle.source !== filters.source) {
            return false;
          }

          // Filter by error presence
          if (filters.hasErrors !== undefined && lifecycle.has_errors !== filters.hasErrors) {
            return false;
          }

          // Filter by date range
          if (filters.dateRange) {
            const startTime = new Date(lifecycle.start_time);
            if (startTime < filters.dateRange.start || startTime > filters.dateRange.end) {
              return false;
            }
          }

          return true;
        });
      },

      summary: () => {
        const { data } = get();
        if (!data) {
          return {
            totalRequests: 0,
            completedRequests: 0,
            errorRequests: 0,
            avgDuration: 0,
            servicesCount: 0,
          };
        }

        const totalRequests = data.lifecycles.length;
        const completedRequests = data.lifecycles.filter(l => l.status === 'COMPLETE').length;
        const errorRequests = data.lifecycles.filter(l => l.has_errors).length;
        
        const durations = data.lifecycles
          .filter(l => l.duration_ms !== null && l.duration_ms !== undefined)
          .map(l => l.duration_ms!);
        
        const avgDuration = durations.length > 0 
          ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
          : 0;

        return {
          totalRequests,
          completedRequests,
          errorRequests,
          avgDuration: Math.round(avgDuration),
          servicesCount: data.services.length,
        };
      },
    }),
    {
      name: 'microtrace-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        darkMode: state.darkMode,
        filters: state.filters 
      }),
    }
  )
);