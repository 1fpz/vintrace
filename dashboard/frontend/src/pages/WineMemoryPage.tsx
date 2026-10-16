import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Clock3,
  Droplets,
  History,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
} from 'lucide-react'

import {
  api,
  type DeviceItem,
  type EnvironmentalIncident,
  type WineMemoryData,
} from '../services/api'
import { mockWineMemory } from '../data/mockWineMemory'

function WineMemoryPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [deviceId, setDeviceId] = useState<string>('vintrace001')
  const [memory, setMemory] = useState<WineMemoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 1. Carregar dispositivos
  useEffect(() => {
    async function loadDevices() {
      try {
        const res = await api.getDevices()
        if (res.items && res.items.length > 0) {
          setDevices(res.items)
          if (!res.items.some((d) => d.id === deviceId)) {
            setDeviceId(res.items[0].id)
          }
        }
      } catch {
        // Fallback
      }
    }
    loadDevices()
  }, [])

  // 2. Carregar Wine Memory real
  useEffect(() => {
    if (!deviceId) return
    async function loadWineMemory() {
      try {
        setLoading(true)
        setError('')
        const data = await api.getWineMemory(deviceId)
        setMemory(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao consultar histórico do STH-Comet'
        setError(msg)
        // Fallback informativo para desenvolvimento
        const fallback = mockWineMemory[deviceId as keyof typeof mockWineMemory]
        if (fallback) {
          setMemory({
            device_id: deviceId,
            ...fallback,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    loadWineMemory()
  }, [deviceId])

  function getIncidentIcon(type: EnvironmentalIncident['type']) {
    if (type === 'temperature') return Thermometer
    if (type === 'humidity') return Droplets
    return Lightbulb
  }

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-amber-400">
          Passaporte Ambiental
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Wine Memory
        </h1>

        <p className="mt-2 max-w-2xl text-zinc-400">
          Consulte o histórico de exposição ambiental gerado a partir dos dados reais do STH-Comet
          comparados com os limites configurados.
        </p>
      </div>

      <div className="mt-8">
        <label className="text-sm text-zinc-400">
          Dispositivo
        </label>

        <select
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-amber-400 sm:max-w-sm"
        >
          {devices.length > 0 ? (
            devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.id}
              </option>
            ))
          ) : (
            <>
              <option value="vintrace001">Adega Principal — vintrace001</option>
              <option value="vintrace002">Adega Reserva — vintrace002</option>
            </>
          )}
        </select>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>STH-Comet indisponível ({error}). Exibindo histórico registrado.</span>
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center p-12 text-zinc-500">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Calculando Passaporte Ambiental a partir do STH-Comet...</span>
        </div>
      ) : memory ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Incidentes
                </p>

                <TriangleAlert
                  size={20}
                  className="text-amber-400"
                />
              </div>

              <p className="mt-3 text-3xl font-semibold">
                {memory.totalIncidents}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Ocorrências registradas
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Tempo de exposição
                </p>

                <Clock3
                  size={20}
                  className="text-amber-400"
                />
              </div>

              <p className="mt-3 text-3xl font-semibold">
                {memory.exposureTime}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Fora das faixas configuradas
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Última ocorrência
                </p>

                <History
                  size={20}
                  className="text-amber-400"
                />
              </div>

              <p className="mt-3 text-xl font-semibold">
                {memory.lastIncident}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Registro mais recente
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Estabilidade
                </p>

                <ShieldCheck
                  size={20}
                  className="text-emerald-400"
                />
              </div>

              <p className="mt-3 text-3xl font-semibold">
                {memory.stability}%
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Período dentro dos limites
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="font-semibold">
                Histórico de ocorrências ambientais
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Eventos gerados pelo confronto dos pontos STH-Comet com os limites cadastrados.
              </p>
            </div>

            {memory.incidents.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Nenhum incidente fora dos limites foi registrado para este dispositivo.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {memory.incidents.map((incident) => {
                  const Icon = getIncidentIcon(incident.type)

                  return (
                    <div
                      key={incident.id}
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-red-950 p-2.5 text-red-400">
                            <Icon size={20} />
                          </div>

                          <div>
                            <h3 className="font-medium text-zinc-200">
                              {incident.title}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                              {incident.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="font-medium text-red-400">
                            {incident.peakValue}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Pico registrado
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-zinc-950 p-4 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-zinc-600">
                            Início
                          </p>

                          <p className="mt-1 text-zinc-300">
                            {incident.startedAt}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-600">
                            Normalização
                          </p>

                          <p className="mt-1 text-zinc-300">
                            {incident.endedAt}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-600">
                            Duração
                          </p>

                          <p className="mt-1 text-zinc-300">
                            {incident.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default WineMemoryPage