import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

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
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = props.type === "password"
  const inputType = isPassword && showPassword ? "text" : props.type ?? "text"

  return (
    <label className="relative block">
      <input
        className={`peer h-[64px] w-full rounded-[14px] border border-[#d7cfc5] bg-white pb-2 pt-6 text-[16px] font-semibold text-[#1f1f1f] outline-none transition focus:border-[#2f2a25] focus:ring-2 focus:ring-[#2f2a2514] ${isPassword ? "pl-5 pr-24" : "px-5"}`}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        type={inputType}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder=" "
        required={props.required}
      />
      {isPassword ? (
        <button
          type="button"
          className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#4f4a44] transition hover:text-[#1f1f1f]"
          onClick={(event) => {
            event.preventDefault()
            setShowPassword((current) => !current)
          }}
          aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
        >
          {showPassword ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
        </button>
      ) : null}
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-[#6d7380] transition-all peer-focus:top-4 peer-focus:text-[12px] peer-focus:text-[#735d49] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[12px]">
        {props.label}
      </span>
    </label>
  )
}
