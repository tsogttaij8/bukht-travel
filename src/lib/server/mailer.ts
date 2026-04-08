import nodemailer from "nodemailer"

export type MailDeliveryResult =
  | { mode: "email"; provider: string }
  | { mode: "dev"; provider: "console" }

function getMailPayload(email: string, code: string, fromEmail: string) {
  return {
    from: fromEmail,
    to: email,
    subject: "BUKHT login code",
    text: `Таны нэвтрэх код: ${code}. Код 10 минут хүчинтэй.`,
    html: `<p>Таны нэвтрэх код: <strong>${code}</strong></p><p>Код 10 минут хүчинтэй.</p>`,
  }
}

export async function sendLoginCodeEmail(email: string, code: string): Promise<MailDeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendAudience = process.env.RESEND_AUDIENCE_ID
  const mailrunUrl = process.env.MAILRUN_API_URL
  const mailrunKey = process.env.MAILRUN_API_KEY
  const fromEmail = process.env.MAIL_FROM ?? "no-reply@bukht.mn"
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT ?? "587")
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465
  const payload = getMailPayload(email, code, fromEmail)
  const hasPartialSmtpConfig = Boolean(smtpHost || smtpUser || smtpPass) && !(smtpHost && smtpUser && smtpPass)

  if (smtpHost && smtpUser && smtpPass) {
    const effectiveFrom = !fromEmail || fromEmail.includes("your-domain.com") ? smtpUser : fromEmail
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: effectiveFrom,
      to: email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    })

    return { mode: "email", provider: "smtp" }
  }

  if (hasPartialSmtpConfig) {
    console.warn("SMTP config is incomplete. Falling back to another mail provider or dev mode.")
  }

  if (resendApiKey) {
    if (!fromEmail || fromEmail.includes("your-domain.com")) {
      throw new Error("MAIL_FROM utga buruu baina. Resend deer batalgaajsan domain email ashiglana uu.")
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        ...(resendAudience ? { audience_id: resendAudience } : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resend failed: ${response.status} ${errorText}`)
    }

    return { mode: "email", provider: "resend" }
  }

  if (mailrunUrl) {
    if (!fromEmail || fromEmail.includes("your-domain.com")) {
      throw new Error("MAIL_FROM utga buruu baina. Ilgeegch email haygaa zov tohiruulna uu.")
    }

    const response = await fetch(mailrunUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(mailrunKey ? { Authorization: `Bearer ${mailrunKey}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Mail service failed: ${response.status} ${errorText}`)
    }

    return { mode: "email", provider: "mailrun" }
  }

  console.log(`[AUTH DEV] login code for ${email}: ${code}`)
  return { mode: "dev", provider: "console" }
}
