"use client"

import { useMemo, useState } from "react"

type OwnerDateRangeFieldProps = {
  label: string
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string, duration: string) => void
}

const weekDays = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]

export default function OwnerDateRangeField(props: OwnerDateRangeFieldProps) {
  const initialMonth = parseDate(props.startDate) ?? new Date()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1))
  const days = useMemo(() => buildMonthDays(month), [month])
  const title = new Intl.DateTimeFormat("mn-MN", { month: "long", year: "numeric" }).format(month)
  const value = props.startDate && props.endDate ? `${props.startDate} - ${props.endDate}` : props.startDate || "Эхлэх ба дуусах огноо сонгох"

  function selectDate(value: string) {
    if (!props.startDate || props.endDate || value < props.startDate) {
      props.onChange(value, "", "")
      return
    }
    props.onChange(props.startDate, value, calculateDays(props.startDate, value))
    setOpen(false)
  }

  function moveMonth(step: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))
  }

  return (
    <div className="relative grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <button type="button" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-50 focus:border-slate-500 focus:ring-2 focus:ring-slate-200" onClick={() => setOpen((current) => !current)}>
        {value}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-[min(100%,360px)] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded-md border border-slate-200 px-2 py-1 text-slate-700" onClick={() => moveMonth(-1)}>‹</button>
            <strong className="text-sm text-slate-950">{title}</strong>
            <button type="button" className="rounded-md border border-slate-200 px-2 py-1 text-slate-700" onClick={() => moveMonth(1)}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((day) => <span key={day} className="py-1 text-slate-400">{day}</span>)}
            {days.map((day, index) => day ? (
              <button key={day.iso} type="button" className={dayClass(day.iso, props.startDate, props.endDate)} onClick={() => selectDate(day.iso)}>
                {day.label}
              </button>
            ) : <span key={`blank-${index}`} />)}
          </div>
          <div className="mt-3 flex justify-between text-xs font-bold text-slate-500">
            <span>{props.startDate ? `Эхлэх: ${props.startDate}` : "Эхлэх өдөр сонго"}</span>
            <span>{props.endDate ? `Дуусах: ${props.endDate}` : "Дуусах өдөр сонго"}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function buildMonthDays(month: Date): Array<{ iso: string; label: number } | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const blanks = Array.from({ length: offset }, () => null)
  const dates = Array.from({ length: count }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index + 1)
    return { iso: toIsoDate(date), label: index + 1 }
  })
  return [...blanks, ...dates]
}

function dayClass(value: string, startDate: string, endDate: string): string {
  const selected = value === startDate || value === endDate
  const inRange = startDate && endDate && value > startDate && value < endDate
  if (selected) return "h-9 rounded-md bg-slate-950 text-xs font-black text-white"
  if (inRange) return "h-9 rounded-md bg-slate-100 text-xs font-black text-slate-900"
  return "h-9 rounded-md text-xs font-black text-slate-700 hover:bg-slate-50"
}

function calculateDays(startDate: string, endDate: string): string {
  const start = Date.parse(`${startDate}T00:00:00`)
  const end = Date.parse(`${endDate}T00:00:00`)
  const diff = end - start
  return Number.isFinite(diff) && diff >= 0 ? String(Math.floor(diff / 86400000) + 1) : ""
}

function parseDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
