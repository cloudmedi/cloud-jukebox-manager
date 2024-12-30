import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";
import Footer from "./Footer";
import Player from "../player/Player";

type PlayerContextType = {
  showPlayer: boolean;
  setShowPlayer: (show: boolean) => void;
};

export const PlayerContext = createContext<PlayerContextType>({
  showPlayer: false,
  setShowPlayer: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const MainLayout = () => {
  const [showPlayer, setShowPlayer] = useState(false);
  
  return (
    <PlayerContext.Provider value={{ showPlayer, setShowPlayer }}>
      <div className="min-h-screen flex flex-col bg-white" data-player-visible={showPlayer}>
        <TopNavigation />
        <main className="flex-1 mt-16">
          <Outlet />
        </main>
        <Footer />
        {showPlayer && <Player />}
      </div>
    </PlayerContext.Provider>
  );
};