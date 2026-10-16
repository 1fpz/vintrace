import type { LucideIcon } from 'lucide-react'

interface SensorCardProps {
  title: string
  value: number
  unit: string
  min: number
  max: number
  icon: LucideIcon
}

function SensorCard({
  title,
  value,
  unit,
  min,
  max,
  icon: Icon,
}: SensorCardProps) {
  const isNormal = value >= min && value <= max

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-zinc-400">
              {title}
            </p>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isNormal
                  ? 'bg-emerald-950 text-emerald-400'
                  : 'bg-red-950 text-red-400'
              }`}
            >
              {isNormal ? 'Normal' : 'Alerta'}
            </span>
          </div>

          <p className="mt-2 text-3xl font-semibold text-white">
            {value}
            <span className="ml-1 text-lg text-zinc-400">
              {unit}
            </span>
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            isNormal
              ? 'bg-zinc-800 text-amber-400'
              : 'bg-red-950 text-red-400'
          }`}
        >
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-500">
          Faixa configurada
        </p>

        <p className="mt-1 text-sm text-zinc-300">
          {min} {unit} a {max} {unit}
        </p>
      </div>
    </div>
  )
}

export default SensorCard