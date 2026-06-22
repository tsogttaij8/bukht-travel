export function Field(props: { label: string; value: string; placeholder?: string; readOnly?: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <input
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={props.value}
        readOnly={props.readOnly}
        placeholder={props.placeholder ?? props.label}
        onChange={(event) => props.onChange?.(event.target.value)}
      />
    </label>
  )
}

type CurrencyOption = {
  code: string
  label: string
  symbol: string
}

const currencyOptions: CurrencyOption[] = [
  { code: "MNT", label: "MN", symbol: "\u20ae" },
  { code: "CNY", label: "CN", symbol: "\u00a5" },
]

export function NumericField(props: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <input
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        inputMode="numeric"
        pattern="[0-9]*"
        value={props.value}
        placeholder={props.placeholder ?? props.label}
        onChange={(event) => props.onChange(onlyDigits(event.target.value))}
      />
    </label>
  )
}

export function DateField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <input
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        type="date"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  )
}

export function CurrencyPriceField(props: { label: string; value: string; currency: string; onChange: (value: string) => void; onCurrencyChange: (value: string) => void }) {
  const selected = currencyOptions.find((item) => item.code === props.currency) ?? currencyOptions[0]
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <div className="grid grid-cols-[minmax(0,1fr)_72px] overflow-hidden rounded-md border border-slate-200 bg-white focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-200">
        <div className="flex min-h-11 items-center">
          <input className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none" inputMode="numeric" pattern="[0-9]*" value={props.value} placeholder="3900000" onChange={(event) => props.onChange(onlyDigits(event.target.value))} />
          <span className="px-3 text-sm font-black text-slate-500">{selected.symbol}</span>
        </div>
        <select className="border-l border-slate-200 bg-slate-50 px-2 text-center text-sm font-black text-slate-800 outline-none" value={props.currency} onChange={(event) => props.onCurrencyChange(event.target.value)}>
          {currencyOptions.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
      </div>
    </label>
  )
}

export function TextArea(props: { label: string; value: string; placeholder?: string; rows?: number; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <textarea
        className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        rows={props.rows ?? 4}
        value={props.value}
        placeholder={props.placeholder ?? props.label}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  )
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}
