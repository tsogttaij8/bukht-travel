import FloatingField from "./FloatingField"
import PasswordMeter from "./PasswordMeter"

type ResetEmailFormProps = {
  resetEmail: string
  busy: boolean
  isLoaded: boolean
  error: string
  onResetEmail: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

type ResetVerifyFormProps = {
  resetCode: string
  newPassword: string
  confirmPassword: string
  busy: boolean
  isLoaded: boolean
  notice: string
  error: string
  onResetCode: (value: string) => void
  onNewPassword: (value: string) => void
  onConfirmPassword: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onResend: () => void
  onChangeEmail: () => void
}

export function ResetEmailForm(props: ResetEmailFormProps) {
  return (
    <form onSubmit={props.onSubmit} className="grid gap-4">
      <FloatingField label="Мэйл хаяг" value={props.resetEmail} onChange={props.onResetEmail} type="email" autoComplete="email" required />
      {props.error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{props.error}</p> : null}
      <button className="btn btn-primary" disabled={props.busy || !props.isLoaded}>{props.busy ? "Илгээж байна..." : "Код авах"}</button>
      <button type="button" className="btn btn-secondary" onClick={props.onBack}>Нэвтрэх рүү буцах</button>
    </form>
  )
}

export function ResetVerifyForm(props: ResetVerifyFormProps) {
  return (
    <form onSubmit={props.onSubmit} className="grid gap-4">
      <FloatingField label="Мэйлээр ирсэн код" value={props.resetCode} onChange={props.onResetCode} inputMode="numeric" autoComplete="one-time-code" required />
      <FloatingField label="Шинэ нууц үг" value={props.newPassword} onChange={props.onNewPassword} type="password" autoComplete="new-password" required />
      <FloatingField label="Шинэ нууц үг давтах" value={props.confirmPassword} onChange={props.onConfirmPassword} type="password" autoComplete="new-password" required />
      <PasswordMeter password={props.newPassword} />
      {props.notice ? <p className="m-0 text-sm font-semibold text-[#1d6b42]">{props.notice}</p> : null}
      {props.error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{props.error}</p> : null}
      <button className="btn btn-primary" disabled={props.busy || !props.isLoaded}>{props.busy ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}</button>
      <button type="button" className="text-sm font-bold text-[#7d4d34] underline" onClick={props.onResend} disabled={props.busy || !props.isLoaded}>Код дахин илгээх</button>
      <button type="button" className="btn btn-secondary" onClick={props.onChangeEmail}>Мэйл солих</button>
    </form>
  )
}
