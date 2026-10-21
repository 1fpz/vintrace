import {
  useCallback,
  useEffect,
  useState,
} from 'react'

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

type HistoryPeriod =
  | '24h'
  | '7d'
  | '30d'

function MonitoringPage() {
  const [period, setPeriod] =
    useState<HistoryPeriod>('24h')

  const [devices, setDevices] =
    useState<DeviceItem[]>([])

  const [deviceId, setDeviceId] =
    useState<string>('vintrace001')

  const [current, setCurrent] = useState({
    temperature: 0,
    humidity: 0,
    luminosity: 0,
  })

  const [triggers, setTriggers] =
    useState<TriggerConfig>({
      temperature: {
        min: 10,
        max: 18,
      },
      humidity: {
        min: 60,
        max: 80,
      },
      luminosity: {
        min: 0,
        max: 20,
      },
    })

  const [history, setHistory] =
    useState<HistorySeries>({
      temperature: [],
      humidity: [],
      luminosity: [],
    })

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(false)

  const [
    historyError,
    setHistoryError,
  ] = useState('')

  const [
    currentError,
    setCurrentError,
  ] = useState('')

  // =====================================================
  // DISPOSITIVOS
  // =====================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const res =
            await api.getDevices()

          setDevices(res.items ?? [])

          if (
            res.items &&
            res.items.length > 0
          ) {
            setDeviceId((currentId) =>
              res.items.some(
                (device) =>
                  device.id === currentId,
              )
                ? currentId
                : res.items[0].id,
            )
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar dispositivos'

          setDevices([])
          setCurrentError(msg)
        }
      })()
    }, 0)

    return () =>
      clearTimeout(timeout)
  }, [])

  // =====================================================
  // TRIGGERS / MONITOR
  // =====================================================

  useEffect(() => {
    if (!deviceId) {
      return
    }

    const timeout = setTimeout(() => {
      void api
        .startMonitoring(deviceId)
        .catch(() => {})

      void (async () => {
        try {
          const res =
            await api.getTriggers(
              deviceId,
            )

          if (res.triggers) {
            setTriggers(
              res.triggers,
            )
          }
        } catch {
          // mantém os valores atuais
        }
      })()
    }, 0)

    return () =>
      clearTimeout(timeout)
  }, [deviceId])

  // =====================================================
  // LEITURA ATUAL
  // =====================================================

  const fetchCurrent =
    useCallback(async () => {
      if (!deviceId) {
        return
      }

      try {
        const res: CurrentReading =
          await api.getCurrentReading(
            deviceId,
          )

        setCurrent({
          temperature:
            res.temperature,
          humidity:
            res.humidity,
          luminosity:
            res.luminosity,
        })

        setCurrentError('')
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Falha ao obter leitura atual'

        setCurrentError(msg)

        setCurrent({
          temperature: 0,
          humidity: 0,
          luminosity: 0,
        })
      }
    }, [deviceId])

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        void fetchCurrent()
      }, 0)

    const interval =
      setInterval(() => {
        void fetchCurrent()
      }, 5000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchCurrent])

  // =====================================================
  // HISTÓRICO
  // =====================================================

  useEffect(() => {
    if (!deviceId) {
      return
    }

    const timeout =
      setTimeout(() => {
        void (async () => {
          try {
            setLoadingHistory(
              true,
            )

            setHistoryError('')

            const res =
              await api.getHistory(
                deviceId,
                period,
              )

            setHistory(
              res.history ?? {
                temperature: [],
                humidity: [],
                luminosity: [],
              },
            )
          } catch (
            err: unknown
          ) {
            const msg =
              err instanceof Error
                ? err.message
                : 'Falha ao consultar STH-Comet'

            setHistoryError(msg)

            setHistory({
              temperature: [],
              humidity: [],
              luminosity: [],
            })
          } finally {
            setLoadingHistory(
              false,
            )
          }
        })()
      }, 0)

    return () =>
      clearTimeout(timeout)
  }, [deviceId, period])

  const temperatureNormal =
    current.temperature >=
      triggers.temperature.min &&
    current.temperature <=
      triggers.temperature.max

  const humidityNormal =
    current.humidity >=
      triggers.humidity.min &&
    current.humidity <=
      triggers.humidity.max

  const luminosityNormal =
    current.luminosity >=
      triggers.luminosity.min &&
    current.luminosity <=
      triggers.luminosity.max

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
          onChange={(event) =>
            setDeviceId(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-amber-400 sm:max-w-sm"
        >
          {devices.length >
          0 ? (
            devices.map(
              (device) => (
                <option
                  key={
                    device.id
                  }
                  value={
                    device.id
                  }
                >
                  {
                    device.name
                  }{' '}
                  —{' '}
                  {
                    device.id
                  }
                </option>
              ),
            )
          ) : (
            <option value="">
              Nenhum dispositivo disponível
            </option>
          )}
        </select>
      </div>

      <div className="mt-6">
        <p className="text-sm text-zinc-400">
          Período
        </p>

        <div className="mt-2 flex w-full gap-2 sm:w-auto">
          {[
            {
              value:
                '24h',
              label:
                '24 horas',
            },
            {
              value:
                '7d',
              label:
                '7 dias',
            },
            {
              value:
                '30d',
              label:
                '30 dias',
            },
          ].map(
            (option) => (
              <button
                key={
                  option.value
                }
                onClick={() =>
                  setPeriod(
                    option.value as HistoryPeriod,
                  )
                }
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                  period ===
                  option.value
                    ? 'bg-amber-400 text-zinc-950'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {
                  option.label
                }
              </button>
            ),
          )}
        </div>
      </div>

      {historyError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertCircle
            size={16}
            className="shrink-0"
          />

          <span>
            STH-Comet :8666 indisponível ({historyError}).
          </span>
        </div>
      )}

      {currentError && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-300">
          <AlertCircle
            size={16}
            className="shrink-0"
          />

          <span>
            Orion Context Broker :1026 ({currentError}).
          </span>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Thermometer
                  size={22}
                />
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
                {
                  current.temperature
                }{' '}
                °C
              </p>

              <p
                className={`mt-1 text-xs ${
                  temperatureNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {temperatureNormal
                  ? 'Normal'
                  : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2
                  className="mr-2 animate-spin"
                  size={20}
                />

                <span>
                  Carregando série STH-Comet...
                </span>
              </div>
            ) : (
              <HistoryChart
                data={
                  history.temperature
                }
                min={
                  triggers.temperature.min
                }
                max={
                  triggers.temperature.max
                }
                unit="°C"
                label="Temperatura"
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Droplets
                  size={22}
                />
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
                {
                  current.humidity
                }
                %
              </p>

              <p
                className={`mt-1 text-xs ${
                  humidityNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {humidityNormal
                  ? 'Normal'
                  : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2
                  className="mr-2 animate-spin"
                  size={20}
                />

                <span>
                  Carregando série STH-Comet...
                </span>
              </div>
            ) : (
              <HistoryChart
                data={
                  history.humidity
                }
                min={
                  triggers.humidity.min
                }
                max={
                  triggers.humidity.max
                }
                unit="%"
                label="Umidade"
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-800 p-3 text-amber-400">
                <Lightbulb
                  size={22}
                />
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
                {
                  current.luminosity
                }
                %
              </p>

              <p
                className={`mt-1 text-xs ${
                  luminosityNormal
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {luminosityNormal
                  ? 'Normal'
                  : 'Alerta'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex h-72 items-center justify-center text-zinc-500">
                <Loader2
                  className="mr-2 animate-spin"
                  size={20}
                />

                <span>
                  Carregando série STH-Comet...
                </span>
              </div>
            ) : (
              <HistoryChart
                data={
                  history.luminosity
                }
                min={
                  triggers.luminosity.min
                }
                max={
                  triggers.luminosity.max
                }
                unit="%"
                label="Luminosidade"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringPage