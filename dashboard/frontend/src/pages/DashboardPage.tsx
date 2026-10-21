import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BellRing,
  Clock3,
  Droplets,
  Lightbulb,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
} from 'lucide-react'

import SensorCard from '../components/SensorCard'
import {
  api,
  type AlertItem,
  type CurrentReading,
  type DeviceItem,
  type TriggerConfig,
} from '../services/api'

function DashboardPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [deviceId, setDeviceId] = useState<string>('vintrace001')

  const [deviceInfo, setDeviceInfo] = useState({
    name: 'Adega principal',
    location: 'Laboratório',
    lastUpdate: 'Atualizando...',
  })

  const [current, setCurrent] = useState({
    temperature: 0,
    humidity: 0,
    luminosity: 0,
  })

  const [triggers, setTriggers] = useState<TriggerConfig>({
    temperature: { min: 10, max: 18 },
    humidity: { min: 60, max: 80 },
    luminosity: { min: 0, max: 20 },
  })

  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [online, setOnline] = useState(false)
  const [apiError, setApiError] = useState('')

  // =====================================================
  // CARREGAR DISPOSITIVOS
  // =====================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.getDevices()

          if (res.items && res.items.length > 0) {
            setDevices(res.items)

            const first = res.items[0]

            setDeviceId(first.id)

            setDeviceInfo({
              name: first.name,
              location: first.location,
              lastUpdate: 'Atualizando...',
            })
          } else {
            setDevices([])
          }

          setApiError('')
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar dispositivos'

          setDevices([])
          setApiError(msg)
          setOnline(false)
        }
      })()
    }, 0)

    return () => clearTimeout(timeout)
  }, [])

  // =====================================================
  // MONITORAMENTO + TRIGGERS
  // =====================================================

  useEffect(() => {
    if (!deviceId) {
      return
    }

    const timeout = setTimeout(() => {
      void api.startMonitoring(deviceId).catch(() => {})

      void (async () => {
        try {
          const res = await api.getTriggers(deviceId)

          if (res.triggers) {
            setTriggers(res.triggers)
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar triggers'

          setApiError(msg)
        }
      })()
    }, 0)

    return () => clearTimeout(timeout)
  }, [deviceId])

  // =====================================================
  // ATUALIZAR LEITURA E ALERTAS
  // =====================================================

  const refreshData = useCallback(async () => {
    if (!deviceId) {
      return
    }

    try {
      const reading: CurrentReading =
        await api.getCurrentReading(deviceId)

      setCurrent({
        temperature: reading.temperature,
        humidity: reading.humidity,
        luminosity: reading.luminosity,
      })

      setOnline(reading.online)

      setDeviceInfo((prev) => ({
        ...prev,
        lastUpdate: new Date(
          reading.timestamp,
        ).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }))

      setApiError('')
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao obter leitura atual'

      setApiError(msg)
      setOnline(false)
    }

    try {
      const alertsRes =
        await api.getAlerts(deviceId)

      setAlerts(alertsRes.alerts ?? [])
    } catch {
      setAlerts([])
    }
  }, [deviceId])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refreshData()
    }, 0)

    const interval = setInterval(() => {
      void refreshData()
    }, 5000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [refreshData])

  // =====================================================
  // STATUS DOS SENSORES
  // =====================================================

  const temperatureNormal =
    current.temperature >= triggers.temperature.min &&
    current.temperature <= triggers.temperature.max

  const humidityNormal =
    current.humidity >= triggers.humidity.min &&
    current.humidity <= triggers.humidity.max

  const luminosityNormal =
    current.luminosity >= triggers.luminosity.min &&
    current.luminosity <= triggers.luminosity.max

  const environmentNormal =
    temperatureNormal &&
    humidityNormal &&
    luminosityNormal

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-400">
            VinTrace Guardian
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Visão Geral
          </h1>

          <p className="mt-2 text-zinc-400">
            Acompanhe as condições ambientais da sua adega em tempo real via FIWARE Orion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {devices.length > 1 && (
            <select
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value)

                const found =
                  devices.find(
                    (device) =>
                      device.id === e.target.value,
                  )

                if (found) {
                  setDeviceInfo({
                    name: found.name,
                    location: found.location,
                    lastUpdate: 'Atualizando...',
                  })
                }
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-400"
            >
              {devices.map((device) => (
                <option
                  key={device.id}
                  value={device.id}
                >
                  {device.name} ({device.id})
                </option>
              ))}
            </select>
          )}

          <div
            className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm ${
              online
                ? 'border-emerald-900 bg-emerald-950 text-emerald-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                online
                  ? 'animate-pulse bg-emerald-400'
                  : 'bg-zinc-500'
              }`}
            />

            {online
              ? 'Dispositivo online'
              : 'Dispositivo offline'}
          </div>
        </div>
      </div>

      {apiError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertCircle
            size={16}
            className="shrink-0"
          />

          <span>
            Aviso da API: {apiError}
          </span>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-400/10 p-3 text-amber-400">
              <Activity size={24} />
            </div>

            <div>
              <h2 className="font-semibold">
                {deviceInfo.name}
              </h2>

              <p className="text-sm text-zinc-500">
                {deviceId} · {deviceInfo.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock3 size={16} />
            {deviceInfo.lastUpdate}
          </div>
        </div>
      </div>

      <div
        className={`mt-6 rounded-2xl border p-5 ${
          environmentNormal
            ? 'border-emerald-900 bg-emerald-950/40'
            : 'border-red-900 bg-red-950/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-xl p-2 ${
              environmentNormal
                ? 'bg-emerald-900/50 text-emerald-400'
                : 'bg-red-900/50 text-red-400'
            }`}
          >
            {environmentNormal ? (
              <ShieldCheck size={24} />
            ) : (
              <TriangleAlert size={24} />
            )}
          </div>

          <div>
            <h2
              className={`font-semibold ${
                environmentNormal
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {environmentNormal
                ? 'Ambiente estável'
                : 'Anomalia detectada'}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {environmentNormal
                ? 'Todos os parâmetros estão dentro das faixas configuradas.'
                : 'Um ou mais parâmetros estão fora dos limites definidos.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SensorCard
          title="Temperatura"
          value={current.temperature}
          unit="°C"
          min={triggers.temperature.min}
          max={triggers.temperature.max}
          icon={Thermometer}
        />

        <SensorCard
          title="Umidade"
          value={current.humidity}
          unit="%"
          min={triggers.humidity.min}
          max={triggers.humidity.max}
          icon={Droplets}
        />

        <SensorCard
          title="Luminosidade"
          value={current.luminosity}
          unit="%"
          min={triggers.luminosity.min}
          max={triggers.luminosity.max}
          icon={Lightbulb}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3 border-b border-zinc-800 p-5">
          <div className="rounded-xl bg-zinc-800 p-2 text-amber-400">
            <BellRing size={20} />
          </div>

          <div>
            <h2 className="font-semibold">
              Alertas recentes
            </h2>

            <p className="text-sm text-zinc-500">
              Últimas alterações ambientais registradas pelo monitor de anomalias.
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          {alerts.length === 0 ? (
            <div className="p-5 text-sm text-zinc-500">
              Nenhum alerta registrado.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-200">
                    {alert.sensor}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {alert.message}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-medium text-red-400">
                    {alert.value}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage