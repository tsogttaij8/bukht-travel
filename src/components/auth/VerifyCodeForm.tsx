import { inputClass, primaryButton, secondaryButton } from "../ui/tw"

type VerifyCodeFormProps = {
  code: string
  devCode: string | null
  error: string
  verifyEmail: string
  mode: "login" | "register"
  onCodeChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onBack: () => void
}

export default function VerifyCodeForm(props: VerifyCodeFormProps) {
  const { code, devCode, error, verifyEmail, mode, onCodeChange, onSubmit, onBack } = props

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input type="email" value={verifyEmail} readOnly className={`${inputClass} bg-[#f8f4ed]`} />
      <input value={code} onChange={(event) => onCodeChange(event.target.value)} placeholder="6 оронтой код" className={inputClass} />
      {error ? <p className="m-0 font-semibold text-[#b42318]">{error}</p> : null}
      {devCode ? <p className="m-0 text-[#5e5448]">DEV код: <strong>{devCode}</strong></p> : null}
      <button className={primaryButton} type="submit">
        {mode === "register" ? "Бүртгэлээ баталгаажуулах" : "Кодоор нэвтрэх"}
      </button>
      <button className={secondaryButton} type="button" onClick={onBack}>
        Буцах
      </button>
    </form>
  )
}
