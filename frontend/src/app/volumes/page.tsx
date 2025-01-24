'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Volume {
  id: string
  name: string
  driver: string
  mountpoint: string
  created: string
  scope: string
  size: number
  labels: Record<string, string>
  inUse?: boolean
}

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVolumes, setSelectedVolumes] = useState<Set<string>>(new Set())
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [volumesToDelete, setVolumesToDelete] = useState<Volume[]>([])

  const fetchVolumes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/volumes`)
      if (!response.ok) throw new Error('Failed to fetch volumes')
      const data = await response.json()
      setVolumes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVolumes()
  }, [])

  const handleSelectVolume = (volumeId: string) => {
    const newSelected = new Set(selectedVolumes)
    if (newSelected.has(volumeId)) {
      newSelected.delete(volumeId)
    } else {
      newSelected.add(volumeId)
    }
    setSelectedVolumes(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedVolumes.size === filteredVolumes.length) {
      setSelectedVolumes(new Set())
    } else {
      setSelectedVolumes(new Set(filteredVolumes.map(vol => vol.id)))
    }
  }

  const handleBulkDeleteClick = () => {
    const volumesToDelete = filteredVolumes.filter(vol => 
      selectedVolumes.has(vol.id) && !vol.inUse
    )
    setVolumesToDelete(volumesToDelete)
  }

  const handleConfirmBulkDelete = async () => {
    try {
      setBulkDeleteLoading(true)
      
      // Delete volumes sequentially
      for (const volume of volumesToDelete) {
        const response = await fetch(`${API_URL}/api/volumes/${volume.name}/`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to delete volume ${volume.name}`)
        }
      }
      
      await fetchVolumes()
      setSelectedVolumes(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volumes')
    } finally {
      setBulkDeleteLoading(false)
      setVolumesToDelete([])
    }
  }

  const filteredVolumes = volumes.filter(volume => {
    const searchLower = searchTerm.toLowerCase()
    return volume.name.toLowerCase().includes(searchLower) ||
           volume.driver.toLowerCase().includes(searchLower) ||
           volume.mountpoint.toLowerCase().includes(searchLower)
  })

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
          <h2 className="text-2xl font-semibold">Volumes</h2>
        </div>

        {/* Search Input */}
        <div className="px-6 pt-4">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Volumes
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, driver, or mount point..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {volumesToDelete.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete these {volumesToDelete.length} volumes?
              </p>
              <div className="max-h-40 overflow-y-auto mb-6">
                {volumesToDelete.map(volume => (
                  <div key={volume.id} className="text-sm text-gray-600 py-1">
                    {volume.name}
                  </div>
                ))}
              </div>
              <p className="text-red-600 text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setVolumesToDelete([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBulkDelete}
                  disabled={bulkDeleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">Loading volumes...</div>
        )}

        {error && (
          <div className="text-red-500 px-6 py-4">{error}</div>
        )}

        {!loading && !error && (
          <div className="p-6">
            {selectedVolumes.size > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleBulkDeleteClick}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Selected ({selectedVolumes.size})
                </button>
              </div>
            )}
            <div className="overflow-x-scroll">
              <table className="min-w-[1024px] w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedVolumes.size === filteredVolumes.length && filteredVolumes.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mount Point
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scope
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolumes.map((volume) => (
                    <tr key={volume.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVolumes.has(volume.id)}
                          onChange={() => handleSelectVolume(volume.id)}
                          disabled={volume.inUse}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate">
                        <Link
                          href={`/volumes/${volume.name}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {volume.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">
                        {volume.driver}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">
                        {formatSize(volume.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate" title={volume.mountpoint}>
                        {volume.mountpoint}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">
                        {new Date(volume.created).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">
                        {volume.scope}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleSelectVolume(volume.id)}
                          disabled={volume.inUse}
                          className={`
                            px-3 py-1 rounded text-white
                            ${volume.inUse
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                            }
                            disabled:opacity-50
                          `}
                          title={volume.inUse ? 'Volume is in use' : 'Delete volume'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVolumes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No volumes found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 