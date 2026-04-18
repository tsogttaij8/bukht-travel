import { primaryButton, secondaryButton } from "../ui/tw"

type LoginModeSwitchProps = {
  mode: "login" | "register"
  onChange: (mode: "login" | "register") => void
}

export default function LoginModeSwitch({ mode, onChange }: LoginModeSwitchProps) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5">
      <button type="button" className={mode === "login" ? primaryButton : secondaryButton} onClick={() => onChange("login")}>
        Нэвтрэх
      </button>
      <button type="button" className={mode === "register" ? primaryButton : secondaryButton} onClick={() => onChange("register")}>
        Бүртгүүлэх
      </button>
    </div>
  )
}
