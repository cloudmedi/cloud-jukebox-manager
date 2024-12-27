import { useQuery } from "@tanstack/react-query";

const Schedule = () => {
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/schedule');
      if (!response.ok) {
        throw new Error('Zamanlama verileri yüklenemedi');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <>
      <h1>Zamanlama</h1>
      <div className="space-y-4">
        {scheduleData.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p>{item.description}</p>
            <p className="text-sm text-muted-foreground">{item.date}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Schedule;
