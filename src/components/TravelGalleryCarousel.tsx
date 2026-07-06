"use client"

import { useEffect, useMemo, useState } from "react"

const slideMs = 5000

export default function TravelGalleryCarousel({ images }: { images: string[] }) {
  const gallery = useMemo(() => images.map((image) => image.trim()).filter(Boolean), [images])
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = gallery.length ? activeIndex % gallery.length : 0

  useEffect(() => {
    if (gallery.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % gallery.length)
    }, slideMs)
    return () => window.clearInterval(timer)
  }, [gallery.length])

  if (!gallery.length) return <div className="travel-gallery-carousel travel-gallery-carousel-empty" />

  return (
    <section className="travel-gallery-carousel" aria-label="Аяллын зураг">
      <div className="travel-gallery-track" style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}>
        {gallery.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="travel-gallery-slide"
            role="img"
            aria-label={`Аяллын зураг ${index + 1}`}
            style={{ backgroundImage: cssImage(image) }}
          />
        ))}
      </div>
      {gallery.length > 1 ? (
        <div className="travel-gallery-dots" aria-label="Зургийн байрлал">
          {gallery.map((image, index) => (
            <button
              key={`${image}-dot-${index}`}
              type="button"
              className={safeActiveIndex === index ? "active" : ""}
              aria-label={`${index + 1}-р зураг харах`}
              aria-current={safeActiveIndex === index}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function cssImage(value: string): string {
  return `url("${value.replace(/"/g, '\\"')}")`
}
