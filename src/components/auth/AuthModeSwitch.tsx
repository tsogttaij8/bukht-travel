import type { AuthMode } from "./clerk-auth-utils"

export default function AuthModeSwitch(props: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return (
    <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[12px] border border-[#e6d8c6] bg-[#fff8ef] p-1">
      <button type="button" onClick={() => props.onChange("login")} className={buttonClass(props.mode === "login")}>
        Нэвтрэх
      </button>
      <button type="button" onClick={() => props.onChange("signup")} className={buttonClass(props.mode === "signup")}>
        Бүртгүүлэх
      </button>
    </div>
  )
}

function buttonClass(active: boolean): string {
  return [
    "rounded-[9px] px-4 py-2.5 text-sm font-extrabold transition",
    active ? "bg-[#7d4d34] text-white shadow-sm" : "text-[#735d49] hover:bg-white/70",
  ].join(" ")
}
