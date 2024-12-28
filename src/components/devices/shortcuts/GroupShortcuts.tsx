import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface GroupShortcutsProps {
  onNewGroup: () => void;
  onRefresh: () => void;
  onSearch?: () => void;  // Made optional with '?'
}

export const GroupShortcuts = ({ onNewGroup, onRefresh, onSearch }: GroupShortcutsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift kombinasyonları
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'n': // Yeni grup
            e.preventDefault();
            onNewGroup();
            toast({
              title: "Kısayol Kullanıldı",
              description: "Yeni grup oluşturma formu açıldı",
            });
            break;
          case 'r': // Yenile
            e.preventDefault();
            onRefresh();
            toast({
              title: "Kısayol Kullanıldı",
              description: "Liste yenilendi",
            });
            break;
          case 'f': // Arama
            if (onSearch) {  // Only call if onSearch is provided
              e.preventDefault();
              onSearch();
              toast({
                title: "Kısayol Kullanıldı",
                description: "Arama kutusuna odaklanıldı",
              });
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNewGroup, onRefresh, onSearch, toast]);

  return null;
};