export interface GroupHistory {
  action: 'create' | 'update' | 'delete' | 'clone';
  changes: any;
  performedBy: string;
  timestamp: string;
}

export interface GroupStatistics {
  totalDevices: number;
  activeDevices: number;
  lastUpdated: string;
}

export interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  isTemplate: boolean;
  templateName?: string;
  history: GroupHistory[];
  statistics: GroupStatistics;
}