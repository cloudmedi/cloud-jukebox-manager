import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Cloud Media Player</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p>Status: <span id="connection-status">Connecting...</span></p>
        <p>Device Token: <span id="device-token">Loading...</span></p>
      </div>
      <div className="mt-4">
        <audio id="audio-player" controls className="w-full" />
      </div>
    </div>
  );
};

export default App;