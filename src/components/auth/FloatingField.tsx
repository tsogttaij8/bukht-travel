type FloatingFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  inputMode?: "numeric" | "text" | "email" | "tel"
  required?: boolean
}

export default function FloatingField(props: FloatingFieldProps) {
  return (
    <label className="relative block">
      <input
        className="peer h-[64px] w-full rounded-[14px] border border-[#d7cfc5] bg-white px-5 pb-2 pt-6 text-[16px] font-semibold text-[#1f1f1f] outline-none transition focus:border-[#2f2a25] focus:ring-2 focus:ring-[#2f2a2514]"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder=" "
        required={props.required}
      />
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-[#6d7380] transition-all peer-focus:top-4 peer-focus:text-[12px] peer-focus:text-[#735d49] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[12px]">
        {props.label}
      </span>
    </label>
  )
}
