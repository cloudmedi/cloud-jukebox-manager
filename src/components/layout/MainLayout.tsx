import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "./Sidebar";
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
      <SidebarProvider>
        <div className="main-layout min-h-screen flex w-full bg-background" data-player-visible={showPlayer}>
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-8">
              <div className="max-w-[1400px] mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">
                    <Outlet />
                  </h1>
                </div>
              </div>
            </main>
            {showPlayer && <Player />}
          </div>
        </div>
      </SidebarProvider>
    </PlayerContext.Provider>
  );
};