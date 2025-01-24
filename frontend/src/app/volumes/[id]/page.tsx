'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageParams } from '@/types/params'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface VolumeDetail {
  id: string
  name: string
  driver: string
  mountpoint: string
  created: string
  scope: string
  labels: Record<string, string>
  options: Record<string, string>
  size: number
  status: {
    mounted: boolean
    inUse: boolean
  }
  mountedContainers: Array<{
    id: string
    name: string
    mountPath: string
    mode: string
    rw: boolean
  }>
}

export default function VolumeDetailPage() {
  const params = useParams() as PageParams
  const volumeId = params.id
  const [volume, setVolume] = useState<VolumeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVolumeDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/volumes/${volumeId}/`)
        if (!response.ok) throw new Error('Failed to fetch volume details')
        const data = await response.json()
        setVolume(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch volume details')
      } finally {
        setLoading(false)
      }
    }

    fetchVolumeDetail()
  }, [volumeId])

  const formatSize = (size: number): string => {
    // Check if size is a valid number
    if (typeof size !== 'number' || isNaN(size) || size < 0) return 'N/A';
    if (size === 0) return '0 B';
  
    const units = ['B', 'KB', 'MB', 'GB'];
    let formattedSize = size;
    let unitIndex = 0;
  
    // Convert size to the appropriate unit
    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }
  
    // Ensure formattedSize is a number before calling toFixed
    if (typeof formattedSize !== 'number' || isNaN(formattedSize)) return 'N/A';
  
    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <DashboardLayout>
      <div className="bg-white">
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-semibold">Volume Details</h2>
        </div>

        {loading && (
          <div className="text-center py-4">Loading volume details...</div>
        )}

        {error && (
          <div className="text-red-500 px-6 py-4">{error}</div>
        )}

        {!loading && !error && volume && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Name:</span> {volume.name}</p>
                  <p><span className="font-medium">ID:</span> {volume.id}</p>
                  <p><span className="font-medium">Driver:</span> {volume.driver}</p>
                  <p><span className="font-medium">Scope:</span> {volume.scope}</p>
                  <p><span className="font-medium">Created:</span> {new Date(volume.created).toLocaleString()}</p>
                  <p><span className="font-medium">Size:</span> {formatSize(volume.size)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mount Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Mount Point:</span> {volume.mountpoint}</p>
                  <p><span className="font-medium">Status:</span> {volume.status.mounted ? 'Mounted' : 'Not Mounted'}</p>
                  <p><span className="font-medium">In Use:</span> {volume.status.inUse ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {volume.mountedContainers?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mounted Containers</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left font-medium pb-2">Name</th>
                        <th className="text-left font-medium pb-2">Mount Path</th>
                        <th className="text-left font-medium pb-2">Mode</th>
                        <th className="text-left font-medium pb-2">Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volume.mountedContainers.map((container) => (
                        <tr key={container.id}>
                          <td className="py-2">{container.name}</td>
                          <td className="py-2">{container.mountPath}</td>
                          <td className="py-2">{container.mode}</td>
                          <td className="py-2">{container.rw ? 'Read/Write' : 'Read Only'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {volume.options && Object.keys(volume.options).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Volume Options</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(volume.options).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-medium">{key}</dt>
                        <dd className="mt-1">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {volume.labels && Object.keys(volume.labels).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Labels</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(volume.labels).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-medium">{key}</dt>
                        <dd className="mt-1">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 