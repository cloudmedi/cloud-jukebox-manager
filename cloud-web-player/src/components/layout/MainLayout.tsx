import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Player from '../player/Player';

export const MainLayout = () => {
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6 pb-24">
        <Outlet />
      </main>
      <Player />
    </div>
  );
};