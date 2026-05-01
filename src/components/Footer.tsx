import Link from "next/link"
import type { ReactNode } from "react"
import { shell } from "./ui/tw"

const bukhtLinks = [
  { href: "/info/bidnii-tuhai", label: "Бидний тухай" },
  { href: "/info/web-uilchilgee", label: "Веб үйлчилгээ" },
  { href: "/info/uilchilgeenii-nuhtsul", label: "Үйлчилгээний нөхцөл" },
  { href: "/info/setgegdluud", label: "Сэтгэгдлүүд" },
]

const helpLinks = [
  { href: "/info/aylal-herhen-zahialah", label: "Аялал хэрхэн захиалах вэ" },
  { href: "/info/business-aylal", label: "Business аялал гэж юу вэ" },
  { href: "/info/baiguullagiin-huudas", label: "Байгууллагын хуудас" },
]

const contactItems = [
  { label: "IG хаяг", value: "" },
  { label: "FB хаяг", value: "" },
  { label: "Утас", value: "" },
  { label: "Мэйл", value: "" },
  { label: "WeChat", value: "" },
].filter((item) => item.value.trim().length > 0)

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(218,197,169,0.8)] bg-[rgba(255,248,239,0.86)] py-10">
      <div className={`${shell} grid gap-8 md:grid-cols-3`}>
        <FooterColumn title="BUKHT">
          {bukhtLinks.map((item) => (
            <FooterLink key={item.href} href={item.href}>{item.label}</FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Тусламж">
          {helpLinks.map((item) => (
            <FooterLink key={item.href} href={item.href}>{item.label}</FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Холбоо барих">
          {contactItems.map((item) => (
            <p key={item.label} className="m-0 text-sm leading-6 text-[#5e554b]">{item.label}: {item.value}</p>
          ))}
        </FooterColumn>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid content-start gap-3">
      <h2 className="m-0 font-[var(--font-heading)] text-lg font-extrabold text-[#241a12]">{title}</h2>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="w-fit rounded-[6px] px-1 py-0.5 text-sm font-semibold leading-6 text-[#5e554b] transition hover:bg-[#fff0dd] hover:text-[#9f5d36] hover:underline">
      {children}
    </Link>
  )
}
