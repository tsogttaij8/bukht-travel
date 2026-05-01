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

function getRoleInvitePayload(email: string, inviteUrl: string, roles: string[], fromEmail: string) {
  const roleText = roles.join(", ")
  return {
    from: fromEmail,
    to: email,
    subject: "BUKHT role invite",
    text: `Танд BUKHT дээр ${roleText} эрхийн invite ирлээ. Accept хийх: ${inviteUrl}`,
    html: `<p>Танд BUKHT дээр <strong>${roleText}</strong> эрхийн invite ирлээ.</p><p><a href="${inviteUrl}">Invite accept хийх</a></p>`,
  }
}

export async function sendLoginCodeEmail(email: string, code: string): Promise<MailDeliveryResult> {
  return sendMailPayload(getMailPayload(email, code, process.env.MAIL_FROM ?? "no-reply@bukht.mn"))
}

export async function sendRoleInviteEmail(email: string, inviteUrl: string, roles: string[]): Promise<MailDeliveryResult> {
  return sendMailPayload(getRoleInvitePayload(email, inviteUrl, roles, process.env.MAIL_FROM ?? "no-reply@bukht.mn"))
}

async function sendMailPayload(payload: { from: string; to: string; subject: string; text: string; html: string }): Promise<MailDeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendAudience = process.env.RESEND_AUDIENCE_ID
  const mailrunUrl = process.env.MAILRUN_API_URL
  const mailrunKey = process.env.MAILRUN_API_KEY
  const fromEmail = payload.from
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT ?? "587")
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465
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
      to: payload.to,
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

  console.log(`[MAIL DEV] ${payload.subject} for ${payload.to}: ${payload.text}`)
  return { mode: "dev", provider: "console" }
}
