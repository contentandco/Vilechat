import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute fresh time by default
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches in mobile environment
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
