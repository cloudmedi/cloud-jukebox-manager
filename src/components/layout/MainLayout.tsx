import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
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
      <div className="main-layout min-h-screen flex flex-col w-full bg-background" data-player-visible={showPlayer}>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
        {showPlayer && <Player />}
      </div>
    </PlayerContext.Provider>
  );
};