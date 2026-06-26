'use client'

import { WorldMap } from '@/components/ui/world-map'

const portfolioMapDots = [
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: 51.5074, lng: -0.1278, label: 'London' },
  },
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
  },
  {
    start: { lat: 51.5074, lng: -0.1278, label: 'London' },
    end: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
  },
  {
    start: { lat: 51.5074, lng: -0.1278, label: 'London' },
    end: { lat: -1.2921, lng: 36.8219, label: 'Nairobi' },
  },
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: -23.5505, lng: -46.6333, label: 'São Paulo' },
  },
]

const regions = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Africa',
  'South America',
]

export default function DistributionMap() {
  return (
    <div>
      <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Portfolio Distribution</h2>
      <WorldMap dots={portfolioMapDots} lineColor="#0052ff" />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {regions.map((region) => (
          <span key={region} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff]" />
            {region}
          </span>
        ))}
      </div>
    </div>
  )
}
