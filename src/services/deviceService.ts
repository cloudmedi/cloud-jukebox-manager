import axios from 'axios';

const API_URL = 'http://localhost:5000/api/devices';

export const getDevices = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createDevice = async (deviceData) => {
  const response = await axios.post(API_URL, deviceData);
  return response.data;
};

export const updateDevice = async (id, deviceData) => {
  const response = await axios.patch(`${API_URL}/${id}`, deviceData);
  return response.data;
};

export const deleteDevice = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const emergencyStop = async () => {
  const response = await fetch('http://localhost:5000/api/devices/emergency-stop', {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Emergency stop failed');
  }
  
  return response.json();
};

export const emergencyReset = async () => {
  const response = await fetch('http://localhost:5000/api/devices/emergency-reset', {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Emergency reset failed');
  }
  
  return response.json();
};
