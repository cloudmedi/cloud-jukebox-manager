import { useQuery } from "@tanstack/react-query";

const Devices = () => {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cihaz Yönetimi</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices?.map((device: any) => (
          <div key={device._id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="font-medium">{device.name}</h3>
            <p className="text-sm text-muted-foreground">{device.location}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                device.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {device.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Devices;