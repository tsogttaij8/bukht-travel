"use client"

import { useMemo, useState } from "react"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"

type CounterKey = "adult" | "child" | "infant" | "singleRoom"

export default function TravelBookingPanel({ travelPackage }: { travelPackage: StoredTravelPackage }) {
  const [counts, setCounts] = useState<Record<CounterKey, number>>({ adult: 0, child: 0, infant: 0, singleRoom: 0 })
  const total = useMemo(
    () =>
      counts.adult * travelPackage.adultPrice +
      counts.child * travelPackage.childPrice +
      counts.infant * travelPackage.infantPrice +
      counts.singleRoom * travelPackage.singleRoomPrice,
    [counts, travelPackage.adultPrice, travelPackage.childPrice, travelPackage.infantPrice, travelPackage.singleRoomPrice]
  )

  function update(key: CounterKey, direction: 1 | -1) {
    setCounts((current) => ({ ...current, [key]: Math.max(0, current[key] + direction) }))
  }

  return (
    <aside className="travel-booking-panel">
      <div className="travel-booking-head">
        <span>Аяллын код</span>
        <strong>{travelPackage.slug}</strong>
      </div>
      <div className="travel-booking-body">
        <div className="travel-detail-chip">{travelPackage.category}</div>
        <div className="travel-fact-grid">
          <Fact label="хугацаа" value={travelPackage.duration} icon="◐" />
          <Fact label="хүн" value={travelPackage.groupSize} icon="♙" />
          <Fact label="хоноглох газар" value={travelPackage.hotel} icon="▥" />
          <Fact label="тээврийн хэрэгсэл" value={travelPackage.transport} icon="▣" />
          <Fact label="хөтчийн хэл" value={travelPackage.language} icon="☆" />
          <Fact label="эхлэх огноо" value={travelPackage.startDate} icon="⌁" />
        </div>
      </div>
      <div className="travel-price-start">
        <span>Эхлэх үнэ:</span>
        <strong>{formatMoney(travelPackage.adultPrice)}</strong>
      </div>
      <div className="travel-counter-list">
        <Counter label="Том хүн" price={travelPackage.adultPrice} value={counts.adult} onMinus={() => update("adult", -1)} onPlus={() => update("adult", 1)} />
        <Counter label="Хүүхэд /2-18 нас/" price={travelPackage.childPrice} value={counts.child} onMinus={() => update("child", -1)} onPlus={() => update("child", 1)} />
        <Counter label="Нярай /0-2 нас/" price={travelPackage.infantPrice} value={counts.infant} onMinus={() => update("infant", -1)} onPlus={() => update("infant", 1)} />
        <Counter label="Буудалд ганцаараа байрлах" price={travelPackage.singleRoomPrice} value={counts.singleRoom} onMinus={() => update("singleRoom", -1)} onPlus={() => update("singleRoom", 1)} />
      </div>
      <div className="travel-total-row">
        <span>Нийт дүн</span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <button type="button" className="travel-buy-button" disabled={total <= 0}>Худалдан авах</button>
    </aside>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="travel-fact">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  )
}

function Counter(props: { label: string; price: number; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="travel-counter-row">
      <div>
        <strong>{props.label}</strong>
        <span>{formatMoney(props.price)}</span>
      </div>
      <div className="travel-counter-controls">
        <button type="button" onClick={props.onMinus} aria-label={`${props.label} хасах`}>−</button>
        <strong>{props.value}</strong>
        <button type="button" onClick={props.onPlus} aria-label={`${props.label} нэмэх`}>+</button>
      </div>
    </div>
  )
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`
}
