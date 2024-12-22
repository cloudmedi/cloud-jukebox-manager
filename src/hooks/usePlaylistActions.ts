import { useCallback } from 'react';
import { usePlaylistStore } from '@/store/playlistStore';
import { useToast } from '@/hooks/use-toast';

export const usePlaylistActions = () => {
  const { toast } = useToast();
  const { setLoading, setError, setPlaylists, deletePlaylist: removePlaylist } = usePlaylistStore();

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const data = await response.json();
      setPlaylists(data);
      setError(null);
    } catch (error) {
      setError(error as Error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch playlists",
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setPlaylists, toast]);

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete playlist');
      
      removePlaylist(id);
      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete playlist",
      });
    }
  }, [removePlaylist, toast]);

  return {
    fetchPlaylists,
    deletePlaylist,
  };
};