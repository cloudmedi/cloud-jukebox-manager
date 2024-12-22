import { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      getDeviceInfo: () => Promise<any>;
      onConnectionStatus: (callback: (status: string) => void) => () => void;
      onDeviceToken: (callback: (token: string) => void) => () => void;
      onWebSocketMessage: (callback: (message: any) => void) => () => void;
    };
  }
}

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const cleanup1 = window.electronAPI.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    const cleanup2 = window.electronAPI.onDeviceToken((token) => {
      setDeviceToken(token);
    });

    const cleanup3 = window.electronAPI.onWebSocketMessage((message) => {
      console.log('Received message:', message);
    });

    window.electronAPI.getDeviceInfo().then((info) => {
      setDeviceInfo(info);
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Cloud Media Player</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p>Status: <span className={`font-bold ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
          {connectionStatus}
        </span></p>
        <p>Device Token: <span className="font-mono">{deviceToken}</span></p>
        {deviceInfo && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Device Information</h2>
            <p>Name: {deviceInfo.deviceName}</p>
            <p>OS: {deviceInfo.osType} {deviceInfo.osVersion}</p>
            <p>CPU: {deviceInfo.cpuModel}</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <audio id="audio-player" controls className="w-full" />
      </div>
    </div>
  );
};

export default App;