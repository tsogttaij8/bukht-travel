export async function sendLoginCodeEmail(email: string, code: string): Promise<void> {
  const mailrunUrl = process.env.MAILRUN_API_URL
  const mailrunKey = process.env.MAILRUN_API_KEY
  const fromEmail = process.env.MAIL_FROM ?? "no-reply@bukht.mn"

  if (!mailrunUrl) {
    console.log(`[AUTH DEV] login code for ${email}: ${code}`)
    return
  }

  const response = await fetch(mailrunUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(mailrunKey ? { Authorization: `Bearer ${mailrunKey}` } : {}),
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "BUKHT login code",
      text: `Таны нэвтрэх код: ${code}. Код 10 минут хүчинтэй.`,
      html: `<p>Таны нэвтрэх код: <strong>${code}</strong></p><p>Код 10 минут хүчинтэй.</p>`,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mail service failed: ${response.status} ${errorText}`)
  }
}
