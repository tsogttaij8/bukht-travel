"use client"

import NextLink from "next/link"
import type { ComponentProps, MouseEvent } from "react"
import { useNavigationLoading } from "./NavigationLoadingProvider"

type TrackedLinkProps = ComponentProps<typeof NextLink>

function hrefString(href: TrackedLinkProps["href"]): string {
  if (typeof href === "string") return href
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(href.query ?? {})) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)))
    else if (value !== undefined && value !== null) params.set(key, String(value))
  }
  const search = params.toString()
  return `${href.pathname ?? ""}${search ? `?${search}` : ""}${href.hash ?? ""}`
}

export default function TrackedLink({ onClick, href, target, download, ...props }: TrackedLinkProps) {
  const { beginNavigation } = useNavigationLoading()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank" ||
      (download !== undefined && download !== false)
    ) return

    beginNavigation(hrefString(href))
  }

  return <NextLink {...props} href={href} target={target} download={download} onClick={handleClick} />
}
