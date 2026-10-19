import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Cpu,
  Loader2,
  Plus,
  X,
} from 'lucide-react'

import DeviceCard from '../components/DeviceCard'
import type { Device } from '../data/mockDevices'
import { api, type DeviceItem } from '../services/api'

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [showForm, setShowForm] = useState(false)

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true)
      setApiError('')

      const res = await api.getDevices()

      if (res.items) {
        setDevices(
          res.items.map((device: DeviceItem) => ({
            id: device.id,
            name: device.name,
            location: device.location,
            online: device.online,
            temperature: device.temperature,
            humidity: device.humidity,
            luminosity: device.luminosity,
          })),
        )
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao conectar com o backend'

      setApiError(msg)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadDevices()
    }, 0)

    return () => clearTimeout(timeout)
  }, [loadDevices])

  async function handleAddDevice(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (
      !id.trim() ||
      !name.trim() ||
      !location.trim()
    ) {
      setFormError(
        'Preencha todos os campos para cadastrar o dispositivo.',
      )

      return
    }

    const deviceExists = devices.some(
      (device) =>
        device.id.toLowerCase() ===
        id.trim().toLowerCase(),
    )

    if (deviceExists) {
      setFormError(
        'Já existe um dispositivo cadastrado com esse ID.',
      )

      return
    }

    try {
      setSubmitting(true)
      setFormError('')

      await api.createDevice({
        device_id: id.trim(),
        name: name.trim(),
        location: location.trim(),
      })

      await loadDevices()

      setId('')
      setName('')
      setLocation('')
      setShowForm(false)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao cadastrar dispositivo'

      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteDevice(
    deviceId: string,
  ) {
    try {
      setApiError('')

      await api.deleteDevice(deviceId)

      await loadDevices()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao excluir dispositivo'

      setApiError(msg)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-400">
            Gerenciamento
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Dispositivos
          </h1>

          <p className="mt-2 text-zinc-400">
            Cadastre e gerencie os dispositivos conectados ao VinTrace.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 self-start rounded-xl bg-amber-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-amber-300"
        >
          <Plus size={18} />
          Novo dispositivo
        </button>
      </div>

      {apiError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertCircle
            size={16}
            className="shrink-0"
          />

          <span>
            Backend offline ou inacessível. ({apiError})
          </span>
        </div>
      )}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Cadastrar dispositivo
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Informe os dados básicos do novo dispositivo.
              </p>
            </div>

            <button
              onClick={() => {
                setShowForm(false)
                setFormError('')
              }}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleAddDevice}
            className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            {formError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300 lg:col-span-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400">
                ID do dispositivo
              </label>

              <input
                value={id}
                onChange={(event) =>
                  setId(event.target.value)
                }
                placeholder="vintrace003"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                Nome
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Adega Premium"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                Local
              </label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Sala climatizada"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-3 lg:items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50 sm:w-auto"
              >
                {submitting
                  ? 'Cadastrando...'
                  : 'Cadastrar dispositivo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800 sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
        <Cpu size={17} />

        <span>
          {devices.length} dispositivo
          {devices.length !== 1 ? 's' : ''} cadastrado
          {devices.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center justify-center p-12 text-zinc-500">
          <Loader2
            className="mr-2 animate-spin"
            size={24}
          />

          <span>Carregando dispositivos...</span>
        </div>
      ) : devices.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onDelete={handleDeleteDevice}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
          <Cpu
            size={32}
            className="mx-auto text-zinc-600"
          />

          <p className="mt-3 font-medium text-zinc-300">
            Nenhum dispositivo cadastrado
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Cadastre um dispositivo para iniciar o monitoramento.
          </p>
        </div>
      )}
    </div>
  )
}

export default DevicesPage