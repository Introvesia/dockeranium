'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Container } from '@/types/container'
import { PageParams } from '@/types/params'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ContainerDetail {
  id: string
  name: string
  image: string
  status: string
  created: string
  config: {
    Hostname: string
    Image: string
    Cmd: string[]
    WorkingDir: string
    Entrypoint: string[]
    Environment: string[]
  }
  networkSettings: {
    Networks: Record<string, {
      IPAddress: string
      Gateway: string
      MacAddress: string
    }>
  }
  mounts: Array<{
    Type: string
    Source: string
    Destination: string
    Mode: string
  }>
  State: {
    Running: boolean
    Status: string
  }
}

export default function ContainerDetailPage() {
  const params = useParams() as PageParams
  const containerId = params.id
  const [container, setContainer] = useState<ContainerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  const fetchContainerDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/containers/${containerId}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch container details')
      const data = await response.json()
      setContainer(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch container details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainerDetail()
  }, [containerId])

  const handleAction = async (action: 'start' | 'stop') => {
    try {
      setActionLoading(true)
      const response = await fetch(`${API_URL}/api/containers/${containerId}/${action}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) throw new Error(`Failed to ${action} container`)
      
      // Refresh container details
      const detailResponse = await fetch(`${API_URL}/api/containers/${containerId}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!detailResponse.ok) throw new Error('Failed to fetch updated container details')
      const data = await detailResponse.json()
      setContainer(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} container`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="bg-white">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Container Details</h2>
          {container && (
            <div className="flex space-x-2">
              {container.State?.Running ? (
                <button
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Stopping...' : 'Stop'}
                </button>
              ) : (
                <button
                  onClick={() => handleAction('start')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Starting...' : 'Start'}
                </button>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-4">Loading container details...</div>
        )}

        {error && (
          <div className="text-red-500 px-6 py-4">{error}</div>
        )}

        {!loading && !error && container && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Name:</span> {container.name}</p>
                  <p><span className="font-medium">ID:</span> {container.id}</p>
                  <p><span className="font-medium">Image:</span> {container.image}</p>
                  <p><span className="font-medium">Status:</span> {container.status}</p>
                  <p><span className="font-medium">Created:</span> {new Date(container.created).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Network Settings</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {container.networkSettings && typeof container.networkSettings === 'object' && container.networkSettings.Networks && typeof container.networkSettings.Networks === 'object' ? (
                    Object.entries(container.networkSettings.Networks).map(([network, settings]) => (
                      <div key={network} className="border-b last:border-0 pb-2">
                        <p><span className="font-medium">Network:</span> {network}</p>
                        <p><span className="font-medium">IP Address:</span> {settings.IPAddress}</p>
                        <p><span className="font-medium">Gateway:</span> {settings.Gateway}</p>
                        <p><span className="font-medium">MAC Address:</span> {settings.MacAddress}</p>
                      </div>
                    ))
                  ) : (
                    <p>No network settings available.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mounts</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium">Type</th>
                      <th className="text-left font-medium">Source</th>
                      <th className="text-left font-medium">Destination</th>
                      <th className="text-left font-medium">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {container.mounts.map((mount, index) => (
                      <tr key={index}>
                        <td className="py-2">{mount.Type}</td>
                        <td className="py-2">{mount.Source}</td>
                        <td className="py-2">{mount.Destination}</td>
                        <td className="py-2">{mount.Mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 