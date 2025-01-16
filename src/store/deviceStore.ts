import { create } from 'zustand';
import type { Device } from '@/types/device';
import { ConnectionStatus } from '@/services/websocket/types';

interface DeviceState {
  devices: Record<string, Device>;
  connectionStatus: Record<string, ConnectionStatus>;
  lastSeen: Record<string, string>;
  updateDevice: (deviceToken: string, updates: Partial<Device>) => void;
  updateConnectionStatus: (deviceToken: string, status: ConnectionStatus) => void;
  updateLastSeen: (deviceToken: string, timestamp: string) => void;
  getDevice: (deviceToken: string) => Device | undefined;
  getConnectionStatus: (deviceToken: string) => ConnectionStatus;
  getLastSeen: (deviceToken: string) => string | undefined;
  optimisticUpdate: (deviceToken: string, updates: Partial<Device>, rollback: () => void) => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: {},
  connectionStatus: {},
  lastSeen: {},

  updateDevice: (deviceToken, updates) => {
    set(state => ({
      devices: {
        ...state.devices,
        [deviceToken]: { ...state.devices[deviceToken], ...updates }
      }
    }));
  },

  updateConnectionStatus: (deviceToken, status) => {
    set(state => ({
      connectionStatus: {
        ...state.connectionStatus,
        [deviceToken]: status
      },
      lastSeen: {
        ...state.lastSeen,
        [deviceToken]: status === 'connected' ? new Date().toISOString() : state.lastSeen[deviceToken]
      }
    }));
  },

  updateLastSeen: (deviceToken, timestamp) => {
    set(state => ({
      lastSeen: {
        ...state.lastSeen,
        [deviceToken]: timestamp
      }
    }));
  },

  getDevice: (deviceToken) => {
    return get().devices[deviceToken];
  },

  getConnectionStatus: (deviceToken) => {
    return get().connectionStatus[deviceToken] || 'disconnected';
  },

  getLastSeen: (deviceToken) => {
    return get().lastSeen[deviceToken];
  },

  optimisticUpdate: (deviceToken, updates, rollback) => {
    const previousState = get().devices[deviceToken];
    
    set(state => ({
      devices: {
        ...state.devices,
        [deviceToken]: { ...state.devices[deviceToken], ...updates }
      }
    }));

    return () => {
      set(state => ({
        devices: {
          ...state.devices,
          [deviceToken]: previousState
        }
      }));
      rollback();
    };
  }
}));
