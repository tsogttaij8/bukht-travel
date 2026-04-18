import { inputClass, primaryButton } from "../ui/tw"

type RequestCodeFormProps = {
  mode: "login" | "register"
  name: string
  email: string
  error: string
  devCode: string | null
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export default function RequestCodeForm(props: RequestCodeFormProps) {
  const { mode, name, email, error, devCode, onNameChange, onEmailChange, onSubmit } = props

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {mode === "register" ? (
        <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Нэр" className={inputClass} />
      ) : null}
      <input
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="Имэйл хаяг"
        className={inputClass}
      />
      {error ? <p className="m-0 font-semibold text-[#b42318]">{error}</p> : null}
      {devCode ? <p className="m-0 text-[#5e5448]">DEV код: <strong>{devCode}</strong></p> : null}
      <button className={primaryButton} type="submit">
        {mode === "register" ? "Бүртгэлийн код авах" : "Нэвтрэх код авах"}
      </button>
    </form>
  )
}
