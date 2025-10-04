import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, LoginInput, SignupInput, AuthResult, AuthSession } from "@/lib/models/types";
import { api } from "./client";
import { isAuthSuccess } from "@/lib/models/types";

// ============================================
// Query Keys
// ============================================

const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
};

// ============================================
// Authentication Hooks
// ============================================

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Restore session from localStorage
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => api.restoreSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (result: AuthResult) => {
      if (isAuthSuccess(result)) {
        // Update user query with logged-in user
        queryClient.setQueryData(queryKeys.currentUser, result.session.user);
        queryClient.setQueryData(queryKeys.session, result.session);
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      }
    },
  });
}

/**
 * Signup mutation
 */
export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => api.signup(input),
    onSuccess: (result: AuthResult) => {
      if (isAuthSuccess(result)) {
        // Update user query with new user
        queryClient.setQueryData(queryKeys.currentUser, result.session.user);
        queryClient.setQueryData(queryKeys.session, result.session);
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      }
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(queryKeys.currentUser, null);
      queryClient.setQueryData(queryKeys.session, null);
      // Invalidate all queries
      queryClient.invalidateQueries();
    },
  });
}
