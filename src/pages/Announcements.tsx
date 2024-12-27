import { useQuery } from "@tanstack/react-query";

const Announcements = () => {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/announcements');
      if (!response.ok) {
        throw new Error('Anonslar yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <>
      <h1>Anons Yönetimi</h1>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="p-4 border rounded-lg">
            <h2 className="font-bold">{announcement.title}</h2>
            <p>{announcement.content}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Announcements;
