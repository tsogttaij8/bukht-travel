import { Facebook, Instagram, Mail, MapPin, Phone, Send, Youtube } from "lucide-react"
import { footerContent } from "../lib/home-content"

const socialIcons = [Facebook, Instagram, Send, Youtube]

export default function Footer() {
  return <footer className="home-footer"><div className="home-shell home-footer__inner">
    <section><h2>Биднийг дагаарай</h2><div className="social-links">{footerContent.social.map((label, index) => { const Icon = socialIcons[index]; return <span className="social-link" aria-label={label} title={label} key={label}><Icon aria-hidden="true" /></span> })}</div></section>
    <section><h2>Холбоо барих</h2><div className="contact-list"><a href={`mailto:${footerContent.email}`}><Mail />{footerContent.email}</a><a href={`tel:${footerContent.phone.replace(/\s/g, "")}`}><Phone />{footerContent.phone}</a><span><MapPin />{footerContent.location}</span></div></section>
  </div></footer>
}
