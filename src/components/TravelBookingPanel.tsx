"use client"

import { useTrackedRouter } from "./ui/useTrackedRouter"
import { useMemo, useState } from "react"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"

type CounterKey = "adult" | "child" | "infant" | "singleRoom"

export default function TravelBookingPanel({ travelPackage, signedIn }: { travelPackage: StoredTravelPackage; signedIn: boolean }) {
  const router = useTrackedRouter()
  const [counts, setCounts] = useState<Record<CounterKey, number>>({ adult: 0, child: 0, infant: 0, singleRoom: 0 })
  const total = useMemo(
    () =>
      counts.adult * travelPackage.adultPrice +
      counts.child * travelPackage.childPrice +
      counts.infant * travelPackage.infantPrice +
      counts.singleRoom * travelPackage.singleRoomPrice,
    [counts, travelPackage.adultPrice, travelPackage.childPrice, travelPackage.infantPrice, travelPackage.singleRoomPrice]
  )
  const formatPackageMoney = (value: number) => formatMoney(value, travelPackage.priceCurrency)

  function update(key: CounterKey, direction: 1 | -1) {
    setCounts((current) => ({ ...current, [key]: Math.max(0, current[key] + direction) }))
  }

  function startBooking() {
    const returnTo = `${window.location.pathname}${window.location.search}`
    const accountPath = `/account?service=travel&title=${encodeURIComponent(travelPackage.title)}&returnTo=${encodeURIComponent(returnTo)}`
    router.push(signedIn ? accountPath : `/login?next=${encodeURIComponent(accountPath)}`)
  }

  return (
    <aside className="sticky top-24 overflow-hidden rounded-[28px] border border-[rgba(225,207,183,0.9)] bg-[#fffaf3] shadow-[0_24px_60px_rgba(100,73,45,0.16)] max-lg:static">
      <div className="flex items-center justify-between gap-3 bg-[#7c5637] px-5 py-4 text-white">
        <span className="text-xs font-black uppercase tracking-[0.16em] opacity-80">Аяллын код</span>
        <strong className="text-sm font-black">{travelPackage.slug}</strong>
      </div>
      <div className="grid gap-4 p-5">
        <div className="w-fit rounded-full bg-[#f1e3d2] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#7c5637]">{travelPackage.category}</div>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Fact label="хугацаа" value={travelPackage.duration} icon="●" />
          <Fact label="хүн" value={travelPackage.groupSize} icon="♙" />
          <Fact label="хоноглох газар" value={travelPackage.hotel} icon="▥" />
          <Fact label="тээврийн хэрэгсэл" value={travelPackage.transport} icon="▣" />
          <Fact label="хөтчийн хэл" value={travelPackage.language} icon="☆" />
          <Fact label="эхлэх огноо" value={travelPackage.startDate} icon="⌁" />
        </div>
      </div>
      <div className="mx-5 mb-4 flex items-center justify-between gap-4 rounded-[18px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgba(225,207,183,0.85)]">
        <span>Эхлэх үнэ:</span>
        <strong className="text-lg font-black text-[#7c5637]">{formatPackageMoney(travelPackage.adultPrice)}</strong>
      </div>
      <div className="grid gap-3 px-5 pb-4">
        <Counter label="Том хүн" price={travelPackage.adultPrice} currency={travelPackage.priceCurrency} value={counts.adult} onMinus={() => update("adult", -1)} onPlus={() => update("adult", 1)} />
        <Counter label="Хүүхэд /2-18 нас/" price={travelPackage.childPrice} currency={travelPackage.priceCurrency} value={counts.child} onMinus={() => update("child", -1)} onPlus={() => update("child", 1)} />
        <Counter label="Нярай /0-2 нас/" price={travelPackage.infantPrice} currency={travelPackage.priceCurrency} value={counts.infant} onMinus={() => update("infant", -1)} onPlus={() => update("infant", 1)} />
        <Counter label="Буудалд ганцаараа байрлах" price={travelPackage.singleRoomPrice} currency={travelPackage.priceCurrency} value={counts.singleRoom} onMinus={() => update("singleRoom", -1)} onPlus={() => update("singleRoom", 1)} />
      </div>
      <div className="mx-5 flex items-center justify-between border-t border-[#ead9c2] py-4">
        <span>Нийт дүн</span>
        <strong className="text-lg font-black text-[#7c5637]">{formatPackageMoney(total)}</strong>
      </div>
      <button type="button" className="mx-5 mb-5 w-[calc(100%-2.5rem)] rounded-full bg-[linear-gradient(135deg,#7d4d34,#b76845)] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(125,77,52,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45" disabled={total <= 0} onClick={startBooking}>Худалдан авах</button>
    </aside>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(225,207,183,0.8)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5eadb] text-[#9a613f]">{icon}</span>
      <div>
        <strong className="block text-sm font-black text-[#241a12]">{value}</strong>
        <small className="block text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#8a7766]">{label}</small>
      </div>
    </div>
  )
}

function Counter(props: { label: string; price: number; currency: StoredTravelPackage["priceCurrency"]; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#ead9c2] bg-white p-3">
      <div>
        <strong className="block text-sm font-black text-[#241a12]">{props.label}</strong>
        <span className="text-xs font-bold text-[#7a6a5c]">{formatMoney(props.price, props.currency)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-[#d8c5ad] bg-[#fffaf3] font-black text-[#7c5637]" onClick={props.onMinus} aria-label={`${props.label} хасах`}>−</button>
        <strong className="min-w-6 text-center font-black text-[#241a12]">{props.value}</strong>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-[#d8c5ad] bg-[#fffaf3] font-black text-[#7c5637]" onClick={props.onPlus} aria-label={`${props.label} нэмэх`}>+</button>
      </div>
    </div>
  )
}

function formatMoney(value: number, currency: StoredTravelPackage["priceCurrency"]): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)}${currency === "CNY" ? "\u00a5" : "\u20ae"}`
}
