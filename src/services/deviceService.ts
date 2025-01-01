import axios from 'axios';
import type { Device } from '@/types/device';

const API_URL = 'http://localhost:5000/api/devices';

export const deviceService = {
  getDevices: async () => {
    const response = await axios.get<Device[]>(API_URL);
    return response.data;
  },

  createDevice: async (deviceData: Partial<Device>) => {
    const response = await axios.post<Device>(API_URL, deviceData);
    return response.data;
  },

  updateDevice: async (id: string, deviceData: Partial<Device>) => {
    const response = await axios.patch<Device>(`${API_URL}/${id}`, deviceData);
    return response.data;
  },

  deleteDevice: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  updateGroup: async (deviceId: string, groupId: string | null) => {
    const response = await axios.patch<Device>(`${API_URL}/${deviceId}`, { groupId });
    return response.data;
  },

  emergencyStop: async () => {
    const response = await fetch(`${API_URL}/emergency-stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Emergency stop failed');
    }
    
    return response.json();
  },

  emergencyReset: async () => {
    const response = await fetch(`${API_URL}/emergency-reset`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Emergency reset failed');
    }
    
    return response.json();
  }
};