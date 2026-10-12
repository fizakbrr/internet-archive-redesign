/** Official wordmark (web.archive.org toolbar asset) recolored to ink through an SVG filter, no download needed. */
export function WaybackWordmark({ className = "h-11" }: { className?: string }) {
  return (
    <>
      <svg aria-hidden="true" className="absolute size-0">
        <filter id="ink-fill">
          <feFlood floodColor="#1c1b19" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://web.archive.org/_static/images/toolbar/wayback-toolbar-logo-200.png"
        alt="Wayback Machine"
        width={200}
        height={44}
        className={`${className} w-auto [filter:url(#ink-fill)]`}
      />
    </>
  )
}
