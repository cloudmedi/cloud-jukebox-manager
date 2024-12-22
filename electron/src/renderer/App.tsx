import { useState, useEffect } from 'react';

const App = () => {
  const [status, setStatus] = useState('Connecting...');
  const [deviceToken, setDeviceToken] = useState('Loading...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // window.api global olarak tanımlanmış electron preload API'sini kullanıyoruz
        const deviceInfo = await window.api.getDeviceInfo();
        if (deviceInfo && deviceInfo.token) {
          setDeviceToken(deviceInfo.token);
          setStatus('Connected');
        } else {
          setStatus('No device token found');
        }
      } catch (error) {
        console.error('Failed to get device info:', error);
        setStatus('Connection failed');
      }
    };

    initializeApp();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Cloud Media Player</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p>Status: <span id="connection-status">{status}</span></p>
        <p>Device Token: <span id="device-token">{deviceToken}</span></p>
      </div>
      <div className="mt-4">
        <audio id="audio-player" controls className="w-full" />
      </div>
    </div>
  );
};

export default App;