import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Player from "../player/Player";

export const MainLayout = () => {
  const [showPlayer, setShowPlayer] = useState(false);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          {showPlayer && <Player />}
        </div>
      </div>
    </SidebarProvider>
  );
};