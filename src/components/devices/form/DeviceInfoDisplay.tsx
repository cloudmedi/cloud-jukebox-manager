interface DeviceInfoDisplayProps {
  deviceInfo: any;
}

export const DeviceInfoDisplay = ({ deviceInfo }: DeviceInfoDisplayProps) => {
  if (!deviceInfo) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-2">Cihaz Bilgileri:</h3>
      <p>Platform: {deviceInfo.platform}</p>
      <p>İşlemci: {deviceInfo.cpus}</p>
      <p>Toplam Bellek: {deviceInfo.totalMemory}</p>
    </div>
  );
};