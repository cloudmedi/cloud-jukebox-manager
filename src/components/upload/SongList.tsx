import { useQuery } from "@tanstack/react-query";
import { Song } from "@/services/songService";

const SongList = () => {
  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/songs');
      if (!response.ok) {
        throw new Error('Şarkılar yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Şarkı Listesi</h2>
      <ul>
        {songs.map(song => (
          <li key={song._id}>
            <h3>{song.name}</h3>
            <p>{song.artist}</p>
            {song.artwork && <img src={`http://localhost:5000${song.artwork}`} alt={song.name} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongList;
