import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Do not retry 4xx errors — they are deterministic
        const httpError = error as { response?: { status?: number } };
        if (
          httpError?.response?.status !== undefined &&
          httpError.response.status >= 400 &&
          httpError.response.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 60_000, // 1 minute
    },
  },
});
