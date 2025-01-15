export type TimeFilter = 'all' | 'latest' | 'today' | 'week' | 'month';

export const timeFilterOptions = [
  { value: 'all', label: 'Tüm Zamanlar' },
  { value: 'latest', label: 'En Son Yüklenenler' },
  { value: 'today', label: 'Bugün Yüklenenler' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' }
] as const;
