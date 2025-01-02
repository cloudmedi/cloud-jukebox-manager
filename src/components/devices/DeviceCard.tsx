import React from 'react';
import { Card } from "@/components/ui/card";
import { Device } from "@/types/device";
import DeviceDownloadProgress from "./DeviceDownloadProgress";

export const DeviceCard = ({ device }: { device: Device }) => {
  return (
    <Card className="hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="text-lg font-semibold">{device.name}</h3>
          <p className="text-sm text-muted-foreground">{device.token}</p>
        </div>
        <div className="flex items-center">
          <span className={`h-2 w-2 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="ml-2 text-sm">{device.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
        </div>
      </div>
      
      {/* İndirme durumu göstergesi */}
      <DeviceDownloadProgress deviceId={device._id} />
      
      <div className="p-4">
        <button className="btn btn-primary">Eylemler</button>
      </div>
    </Card>
  );
};

export default DeviceCard;
