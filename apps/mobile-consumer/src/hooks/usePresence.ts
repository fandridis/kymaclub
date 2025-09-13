import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';

interface PresenceHookOptions {
  enabled?: boolean;
  deviceId?: string;
}

interface PresenceState {
  isActive: boolean;
  activeThreadId: Id<"chatMessageThreads"> | null;
  appState: 'active' | 'background' | 'inactive';
}

/**
 * React Native hook for managing user presence tracking
 * 
 * Automatically tracks app state changes and provides methods to update
 * conversation presence for smart notification delivery.
 */
export function usePresence(options: PresenceHookOptions = {}) {
  const { enabled = true, deviceId } = options;
  
  const updatePresenceMutation = useMutation(api.mutations.presence.updateUserPresence);
  const clearPresenceMutation = useMutation(api.mutations.presence.clearUserPresence);
  
  // Track current presence state
  const presenceState = useRef<PresenceState>({
    isActive: true,
    activeThreadId: null,
    appState: 'active',
  });
  
  // Track if we've sent an update recently to avoid spam
  const lastUpdateTime = useRef<number>(0);
  const UPDATE_THROTTLE_MS = 5000; // 5 seconds

  // Update presence with throttling
  const updatePresence = useCallback(async (updates: Partial<PresenceState>) => {
    if (!enabled) return;
    
    const now = Date.now();
    const shouldThrottle = now - lastUpdateTime.current < UPDATE_THROTTLE_MS;
    
    // Update local state
    presenceState.current = { ...presenceState.current, ...updates };
    
    // Skip throttled updates unless it's a significant change
    const isSignificantChange = updates.activeThreadId !== undefined || updates.appState !== undefined;
    if (shouldThrottle && !isSignificantChange) {
      return;
    }
    
    try {
      await updatePresenceMutation({
        isActive: presenceState.current.isActive,
        activeThreadId: presenceState.current.activeThreadId,
        appState: presenceState.current.appState,
        deviceId,
        deviceType: 'mobile',
      });
      
      lastUpdateTime.current = now;
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [enabled, updatePresenceMutation, deviceId]);

  // Handle app state changes
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      let mappedState: 'active' | 'background' | 'inactive';
      let isActive: boolean;

      switch (nextAppState) {
        case 'active':
          mappedState = 'active';
          isActive = true;
          break;
        case 'background':
          mappedState = 'background';
          isActive = false;
          break;
        case 'inactive':
        default:
          mappedState = 'inactive';
          isActive = false;
          break;
      }

      updatePresence({
        appState: mappedState,
        isActive,
        // Clear active thread when app goes to background/inactive
        activeThreadId: isActive ? presenceState.current.activeThreadId : null,
      });
    };

    // Set initial state
    const currentState = AppState.currentState;
    handleAppStateChange(currentState);

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [enabled, updatePresence]);

  // Cleanup presence on unmount
  useEffect(() => {
    if (!enabled) return;

    return () => {
      // Clear presence when hook unmounts (app closing, user logout, etc.)
      clearPresenceMutation().catch(error => {
        console.error('Failed to clear presence on unmount:', error);
      });
    };
  }, [enabled, clearPresenceMutation]);

  // Enter conversation
  const enterConversation = useCallback((threadId: Id<"chatMessageThreads">) => {
    updatePresence({
      activeThreadId: threadId,
      isActive: true,
    });
  }, [updatePresence]);

  // Leave conversation
  const leaveConversation = useCallback(() => {
    updatePresence({
      activeThreadId: null,
    });
  }, [updatePresence]);

  // Set active state manually
  const setActive = useCallback((isActive: boolean) => {
    updatePresence({
      isActive,
      activeThreadId: isActive ? presenceState.current.activeThreadId : null,
    });
  }, [updatePresence]);

  // Clear all presence
  const clearPresence = useCallback(async () => {
    if (!enabled) return;
    
    try {
      await clearPresenceMutation();
      presenceState.current = {
        isActive: false,
        activeThreadId: null,
        appState: 'inactive',
      };
    } catch (error) {
      console.error('Failed to clear presence:', error);
    }
  }, [enabled, clearPresenceMutation]);

  return {
    // Current state
    currentState: presenceState.current,
    
    // Actions
    enterConversation,
    leaveConversation,
    setActive,
    clearPresence,
    
    // Manual update
    updatePresence,
  };
}