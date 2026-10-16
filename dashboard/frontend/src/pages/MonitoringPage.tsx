import { useEffect, useState, useCallback } from 'react'
import {
  AlertCircle,
  Droplets,
  Lightbulb,
  Loader2,
  Thermometer,
} from 'lucide-react'

import HistoryChart from '../components/HistoryChart'
import {
  api,
  type CurrentReading,
  type DeviceItem,
  type HistorySeries,
  type TriggerConfig,
} from '../services/api'
import { mockMonitoringData } from '../data/mockHistory'

type HistoryPeriod = '24h' | '7d' | '30d'

function MonitoringPage() {
  const [period, setPeriod] = useState<HistoryPeriod>('24h')
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [deviceId, setDeviceId] = useState<string>('vintrace001')

  const [current, setCurrent] = useState<{ temperature: number; humidity: number; luminosity: number }>({
    temperature: 14.2,
    humidity: 68.0,
    luminosity: 12.0,
  })

  const [triggers, setTriggers] = useState<TriggerConfig>({
    temperature: { min: 10, max: 18 },
    humidity: { min: 60, max: 80 },
    luminosity: { min: 0, max: 20 },
  })

  const [history, setHistory] = useState<HistorySeries>({
    temperature: [],
    humidity: [],
    luminosity: [],
  })

  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [currentError, setCurrentError] = useState('')

  // 1. Carregar lista de dispositivos
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
        // Fallback para vintrace001
      }
    }
    loadDevices()
  }, [])

  // 2. Iniciar monitoramento ao selecionar dispositivo e carregar triggers
  useEffect(() => {
    if (!deviceId) return
    api.startMonitoring(deviceId).catch(() => {})

    async function loadTriggers() {
      try {
        const res = await api.getTriggers(deviceId)
        if (res.triggers) {
          setTriggers(res.triggers)
        }
      } catch {
        // Triggers default mantidos
      }
    }
    loadTriggers()
  }, [deviceId])

  // 3. Carregar leitura atual
  const fetchCurrent = useCallback(async () => {
    if (!deviceId) return
    try {
      const res: CurrentReading = await api.getCurrentReading(deviceId)
      setCurrent({
        temperature: res.temperature,
        humidity: res.humidity,
        luminosity: res.luminosity,
      })
      setCurrentError('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao obter leitura atual'
      setCurrentError(msg)
      // Fallback para mock se API estiver offline
      const mockDev = mockMonitoringData[deviceId as keyof typeof mockMonitoringData]
      if (mockDev) {
        setCurrent(mockDev.current)
      }
    }
  }, [deviceId])

  useEffect(() => {
    fetchCurrent()
    const interval = setInterval(fetchCurrent, 5000)
    return () => clearInterval(interval)
  }, [fetchCurrent])

  // 4. Carregar histórico STH-Comet
  useEffect(() => {
    if (!deviceId) return
    async function loadHistory() {
      try {
        setLoadingHistory(true)
        setHistoryError('')
        const res = await api.getHistory(deviceId, period)
        if (res && res.history) {
          setHistory(res.history)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao consultar STH-Comet'
        setHistoryError(msg)
        // Se STH-Comet estiver inacessível, NÃO mascarar silenciosamente: exibe erro
        const mockDev = mockMonitoringData[deviceId as keyof typeof mockMonitoringData]
        if (mockDev && mockDev.history && mockDev.history[period]) {
          setHistory(mockDev.history[period])
        }
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [deviceId, period])

  const temperatureNormal =
    current.temperature >= triggers.temperature.min &&
    current.temperature <= triggers.temperature.max

  const humidityNormal =
    current.humidity >= triggers.humidity.min &&
    current.humidity <= triggers.humidity.max

  const luminosityNormal =
    current.luminosity >= triggers.luminosity.min &&
    current.luminosity <= triggers.luminosity.max

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-amber-400">
          Dados ambientais
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Monitoramento
        </h1>

        <p className="mt-2 text-zinc-400">
          Acompanhe os dados atuais e o histórico real dos sensores (STH-Comet :8666).
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

      <div className="mt-6">
        <p className="text-sm text-zinc-400">
          Período
        </p>

        <div className="mt-2 flex w-full gap-2 sm:w-auto">
          {[
            { value: '24h', label: '24 horas' },
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value as HistoryPeriod)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                period === option.value
                  ? 'bg-amber-400 text-zinc-950'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {historyError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>STH-Comet :8666 indisponível ({historyError}). Exibindo referências locais.</span>
        </div>
      )}

      {currentError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>Orion Context Broker :1026 ({currentError}).</span>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* TEMPERATURA */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Thermometer size={22} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Temperatura
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Histórico do período selecionado
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold">
                {current.temperature} °C
              </p>

              <p
                className={`mt-1 text-xs ${
                  temperatureNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {temperatureNormal ? 'Normal' : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span>Carregando série STH-Comet...</span>
              </div>
            ) : (
              <HistoryChart
                data={history.temperature}
                min={triggers.temperature.min}
                max={triggers.temperature.max}
                unit="°C"
                label="Temperatura"
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              Limite mínimo: {triggers.temperature.min} °C
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-red-500" />
              Limite máximo: {triggers.temperature.max} °C
            </div>
          </div>
        </div>

        {/* UMIDADE */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Droplets size={22} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Umidade
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Histórico do período selecionado
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold">
                {current.humidity}%
              </p>

              <p
                className={`mt-1 text-xs ${
                  humidityNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {humidityNormal ? 'Normal' : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span>Carregando série STH-Comet...</span>
              </div>
            ) : (
              <HistoryChart
                data={history.humidity}
                min={triggers.humidity.min}
                max={triggers.humidity.max}
                unit="%"
                label="Umidade"
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              Limite mínimo: {triggers.humidity.min}%
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-red-500" />
              Limite máximo: {triggers.humidity.max}%
            </div>
          </div>
        </div>

        {/* LUMINOSIDADE */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Lightbulb size={22} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Luminosidade
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Histórico do período selecionado
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold">
                {current.luminosity}%
              </p>

              <p
                className={`mt-1 text-xs ${
                  luminosityNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {luminosityNormal ? 'Normal' : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span>Carregando série STH-Comet...</span>
              </div>
            ) : (
              <HistoryChart
                data={history.luminosity}
                min={triggers.luminosity.min}
                max={triggers.luminosity.max}
                unit="%"
                label="Luminosidade"
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              Limite mínimo: {triggers.luminosity.min}%
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-red-500" />
              Limite máximo: {triggers.luminosity.max}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringPage