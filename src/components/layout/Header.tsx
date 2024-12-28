import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { Player } from "@/components/player/Player";
import { usePlayerStore } from "@/store/playerStore";

const Header = () => {
  const showPlayer = usePlayerStore((state) => state.showPlayer);

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex flex-1">
          {showPlayer && <Player />}
        </div>
        <div className="flex items-center gap-4">
          <NotificationsPopover />
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
};

export default Header;