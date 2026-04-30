import { passwordChecks, passwordMessage } from "./clerk-auth-utils"

export default function PasswordMeter({ password }: { password: string }) {
  const checks = passwordChecks(password)
  const strong = Object.values(checks).every(Boolean)
  const items = [
    { label: "8-аас дээш тэмдэгттэй байх", checked: checks.length },
    { label: "Үсэг агуулсан байх", checked: checks.letter },
    { label: "Тоо агуулсан байх", checked: checks.number },
    { label: "Тусгай тэмдэгт агуулсан байх", checked: checks.symbol },
  ]

  return (
    <div className="grid gap-3 rounded-[10px] bg-[#fff8ef] p-3 text-sm">
      <p className={`m-0 font-bold ${strong ? "text-[#1d6b42]" : "text-[#7a5a43]"}`}>
        {passwordMessage(password)}
      </p>
      <ul className="m-0 grid list-none gap-2 p-0 text-[#5f5144]">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              readOnly
              aria-label={item.label}
              className="h-4 w-4 accent-[#1d6b42]"
            />
            <span className={item.checked ? "font-bold text-[#1d6b42]" : undefined}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
