export interface DeviceInfo {
  hostname: string;
  platform: string;
  language: string;
  screenResolution: string;
  timeZone: string;
  browserInfo: {
    name: string;
    version: string;
  };
}

export interface TokenResponse {
  token: string;
  deviceInfo: DeviceInfo;
}