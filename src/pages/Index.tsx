import { DeviceRegistration } from "@/components/device/DeviceRegistration";

const Index = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Cloud Jukebox Manager
      </h1>
      <DeviceRegistration />
    </div>
  );
};

export default Index;