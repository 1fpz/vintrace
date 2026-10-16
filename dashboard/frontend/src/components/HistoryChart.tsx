import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface HistoryPoint {
  time: string
  value: number
}

interface HistoryChartProps {
  data: HistoryPoint[]
  min: number
  max: number
  unit: string
  label: string
}

function HistoryChart({
  data,
  min,
  max,
  unit,
  label,
}: HistoryChartProps) {
  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
          />

          <XAxis
            dataKey="time"
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />

          <YAxis
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
            }}
            labelStyle={{
              color: '#a1a1aa',
            }}
            formatter={(value) => [
              `${value} ${unit}`,
              label,
            ]}
          />

          <ReferenceLine
            y={min}
            stroke="#10b981"
            strokeDasharray="5 5"
          />

          <ReferenceLine
            y={max}
            stroke="#ef4444"
            strokeDasharray="5 5"
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#fbbf24"
            strokeWidth={3}
            dot={{
              fill: '#fbbf24',
              r: 3,
            }}
            activeDot={{
              r: 5,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HistoryChart