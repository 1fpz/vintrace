import { useState } from 'react'
import {
  AlertTriangle,
  Droplets,
  Lightbulb,
  MapPin,
  Thermometer,
  Trash2,
  X,
} from 'lucide-react'

import type { Device } from '../data/mockDevices'

interface DeviceCardProps {
  device: Device
  onDelete: (id: string) => void
}

function DeviceCard({
  device,
  onDelete,
}: DeviceCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function handleDelete() {
    onDelete(device.id)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-white">
                {device.name}
              </h2>

              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  device.online
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {device.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {device.id}
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
              <MapPin size={16} />
              {device.location}
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-950 hover:text-red-400"
            title="Excluir dispositivo"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4">
          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <Thermometer size={14} />
              <span className="text-xs">Temp.</span>
            </div>

            <p className="mt-1 text-sm font-medium">
              {device.temperature} °C
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <Droplets size={14} />
              <span className="text-xs">Umidade</span>
            </div>

            <p className="mt-1 text-sm font-medium">
              {device.humidity}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <Lightbulb size={14} />
              <span className="text-xs">Luz</span>
            </div>

            <p className="mt-1 text-sm font-medium">
              {device.luminosity}%
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-950 p-2.5 text-red-400">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Excluir dispositivo
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Esta ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-6 text-zinc-300">
                Tem certeza que deseja excluir o dispositivo{' '}
                <span className="font-semibold text-white">
                  {device.name}
                </span>
                ?
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                ID: {device.id}
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500"
                >
                  <Trash2 size={17} />
                  Excluir dispositivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DeviceCard