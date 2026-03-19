import { useMemo } from 'react'
import type { HeatmapEntry } from '../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '../date'

interface DayCell {
  date: string | null
  count: number
}

interface MonthLabel {
  label: string
  span: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function buildCalendar(data: HeatmapEntry[], endDate: Date) {
  const counts = new Map(data.map(d => [d.date, d.count]))

  const startDate = new Date(endDate)
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)

  const startDow = startDate.getDay()
  const weeks: DayCell[][] = [[]]

  for (let i = 0; i < startDow; i++) {
    weeks[0].push({ date: null, count: 0 })
  }

  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = formatDate(current)
    if (weeks[weeks.length - 1].length === 7) {
      weeks.push([])
    }
    weeks[weeks.length - 1].push({
      date: dateStr,
      count: counts.get(dateStr) ?? 0,
    })
    current.setDate(current.getDate() + 1)
  }

  const last = weeks[weeks.length - 1]
  while (last.length < 7) {
    last.push({ date: null, count: 0 })
  }

  const months: MonthLabel[] = []
  let prevMonth = -1
  for (const week of weeks) {
    const firstDay = week.find(d => d.date !== null)
    if (!firstDay?.date) {
      if (months.length > 0) months[months.length - 1].span++
      continue
    }
    const month = parseInt(firstDay.date.split('-')[1]) - 1
    if (month !== prevMonth) {
      months.push({ label: MONTH_NAMES[month], span: 1 })
      prevMonth = month
    } else {
      months[months.length - 1].span++
    }
  }

  return { weeks, months }
}

function cellColor(count: number, hasDate: boolean): string {
  if (!hasDate) return 'bg-transparent'
  if (count === 0) return 'bg-[#161b16]'
  if (count === 1) return 'bg-neon/20'
  if (count === 2) return 'bg-neon/40'
  if (count <= 4) return 'bg-neon/60'
  return 'bg-neon/80'
}

interface Props {
  data: HeatmapEntry[]
  endDate: Date
  onShift: (delta: number) => void
}

export default function Heatmap({ data, endDate, onShift }: Props) {
  const { weeks, months } = useMemo(() => buildCalendar(data, endDate), [data, endDate])
  const isPresent = formatDate(endDate) === formatDate(new Date())

  const startDate = new Date(endDate)
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)

  const label = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()} - ${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 uppercase tracking-wider">Activity</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onShift(-1)}
            className="text-gray-600 hover:text-neon transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono text-gray-400 min-w-[160px] text-center">{label}</span>
          <button
            onClick={() => onShift(1)}
            disabled={isPresent}
            className="text-gray-600 hover:text-neon transition-colors disabled:opacity-20 disabled:hover:text-gray-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1 ml-8 mb-1">
            {months.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-gray-600"
                style={{ width: m.span * 13 - 2 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[2px]">
            <div className="flex flex-col gap-[2px] mr-1">
              {DAY_LABELS.map((d, i) => (
                <span
                  key={i}
                  className="text-[10px] text-gray-600 h-[11px] leading-[11px] w-6 text-right pr-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date ? `${day.date}: ${day.count} solve${day.count !== 1 ? 's' : ''}` : ''}
                    className={`w-[11px] h-[11px] rounded-sm ${cellColor(day.count, !!day.date)} ${
                      day.count > 0 ? 'shadow-[0_0_4px_rgba(0,255,65,0.15)]' : ''
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
