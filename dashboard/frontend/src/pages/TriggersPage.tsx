import {
  useEffect,
  useState,
} from 'react'

import {
  CheckCircle2,
  Droplets,
  Lightbulb,
  Loader2,
  Save,
  Thermometer,
  TriangleAlert,
} from 'lucide-react'

import {
  api,
  type DeviceItem,
  type TriggerConfig,
} from '../services/api'

const DEFAULT_FORM: TriggerConfig = {
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
}

function TriggersPage() {
  const [devices, setDevices] =
    useState<DeviceItem[]>([])

  const [deviceId, setDeviceId] =
    useState('vintrace001')

  const [form, setForm] =
    useState<TriggerConfig>(
      DEFAULT_FORM,
    )

  const [loading, setLoading] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const res =
            await api.getDevices()

          setDevices(
            res.items ?? [],
          )

          if (
            res.items &&
            res.items.length > 0
          ) {
            setDeviceId(
              (currentId) =>
                res.items.some(
                  (device) =>
                    device.id ===
                    currentId,
                )
                  ? currentId
                  : res.items[0]
                      .id,
            )
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Falha ao carregar dispositivos'

          setDevices([])
          setError(msg)
        }
      })()
    }, 0)

    return () =>
      clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!deviceId) {
      return
    }

    const timeout =
      setTimeout(() => {
        void (async () => {
          try {
            setLoading(true)
            setError('')
            setSuccess('')

            const res =
              await api.getTriggers(
                deviceId,
              )

            if (res.triggers) {
              setForm(
                res.triggers,
              )
            }
          } catch (
            err: unknown
          ) {
            const msg =
              err instanceof Error
                ? err.message
                : 'Falha ao carregar triggers'

            setError(
              `Erro ao carregar: ${msg}`,
            )
          } finally {
            setLoading(false)
          }
        })()
      }, 0)

    return () =>
      clearTimeout(timeout)
  }, [deviceId])

  function handleDeviceChange(
    newDeviceId: string,
  ) {
    setDeviceId(newDeviceId)
    setError('')
    setSuccess('')
  }

  function updateTrigger(
    sensor:
      keyof TriggerConfig,
    field: 'min' | 'max',
    value: number,
  ) {
    setForm((current) => ({
      ...current,
      [sensor]: {
        ...current[sensor],
        [field]: value,
      },
    }))

    setError('')
    setSuccess('')
  }

  async function handleSave() {
    const invalidTemperature =
      form.temperature.min >=
      form.temperature.max

    const invalidHumidity =
      form.humidity.min >=
      form.humidity.max

    const invalidLuminosity =
      form.luminosity.min >=
      form.luminosity.max

    if (
      invalidTemperature ||
      invalidHumidity ||
      invalidLuminosity
    ) {
      setSuccess('')

      setError(
        'O limite mínimo precisa ser menor que o limite máximo em todos os sensores.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res =
        await api.updateTriggers(
          deviceId,
          form,
        )

      setSuccess(
        res.message ||
          'Triggers persistidos com sucesso no backend.',
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao salvar triggers'

      setError(
        `Erro ao salvar: ${msg}`,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-amber-400">
          Controle ambiental
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Triggers
        </h1>

        <p className="mt-2 text-zinc-400">
          Defina os limites oficiais que disparam alertas remotos no ESP32.
        </p>
      </div>

      <div className="mt-8">
        <label className="text-sm text-zinc-400">
          Dispositivo
        </label>

        <select
          value={deviceId}
          onChange={(event) =>
            handleDeviceChange(
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

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2
            className="animate-spin"
            size={16}
          />

          <span>
            Carregando triggers da API...
          </span>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-300">
          <TriangleAlert
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-300">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm">
            {success}
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
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

              <p className="text-sm text-zinc-500">
                Faixa permitida em °C
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400">
                Mínimo
              </label>

              <input
                type="number"
                step="0.5"
                value={
                  form.temperature
                    .min
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'temperature',
                    'min',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                Máximo
              </label>

              <input
                type="number"
                step="0.5"
                value={
                  form.temperature
                    .max
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'temperature',
                    'max',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
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

              <p className="text-sm text-zinc-500">
                Faixa permitida em %
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400">
                Mínimo
              </label>

              <input
                type="number"
                step="1"
                value={
                  form.humidity.min
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'humidity',
                    'min',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                Máximo
              </label>

              <input
                type="number"
                step="1"
                value={
                  form.humidity.max
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'humidity',
                    'max',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
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

              <p className="text-sm text-zinc-500">
                Faixa permitida em %
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400">
                Mínimo
              </label>

              <input
                type="number"
                step="1"
                value={
                  form.luminosity
                    .min
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'luminosity',
                    'min',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                Máximo
              </label>

              <input
                type="number"
                step="1"
                value={
                  form.luminosity
                    .max
                }
                onChange={(
                  event,
                ) =>
                  updateTrigger(
                    'luminosity',
                    'max',
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm leading-6 text-zinc-400">
          Quando um valor ultrapassar os limites configurados, o backend identificará a anomalia e acionará remotamente os alertas visuais (LED azul) e sonoros (buzzer) do dispositivo via FIWARE.
        </p>

        <button
          onClick={
            handleSave
          }
          disabled={
            saving ||
            !deviceId
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-medium text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50 sm:w-auto"
        >
          {saving ? (
            <Loader2
              className="animate-spin"
              size={18}
            />
          ) : (
            <Save
              size={18}
            />
          )}

          {saving
            ? 'Salvando...'
            : 'Salvar triggers'}
        </button>
      </div>
    </div>
  )
}

export default TriggersPage