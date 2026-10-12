"use client"

import { Slider } from "@base-ui/react/slider"
import { Captions, CaptionsOff, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "cn"
import { formatDuration } from "@/lib/format"

type Source = { src: string; type: string }

const noop = () => () => {}
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false)

const showCaptions = (video: HTMLVideoElement | null, on: boolean) => {
  const t = video?.textTracks[0]
  if (t) t.mode = on ? "showing" : "hidden"
}

const MEDIA_EVENTS = ["play", "pause", "timeupdate", "durationchange", "loadedmetadata", "volumechange", "emptied"]

function useMediaState(ref: React.RefObject<HTMLMediaElement | null>) {
  const [s, setS] = useState({ playing: false, time: 0, duration: 0, muted: false })
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const sync = () => setS({ playing: !m.paused, time: m.currentTime, duration: Number.isFinite(m.duration) ? m.duration : 0, muted: m.muted })
    MEDIA_EVENTS.forEach((e) => m.addEventListener(e, sync))
    return () => MEDIA_EVENTS.forEach((e) => m.removeEventListener(e, sync))
  }, [ref])
  return s
}

function ControlButton({ label, dark, pressed, onClick, children }: { label: string; dark?: boolean; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-md [&_svg]:size-5", dark ? "hover:bg-line-inverse" : "hover:bg-sunken")}
    >
      {children}
    </button>
  )
}

/** Play, seek, time and mute for any media element; `children` adds extra buttons at the end. */
function Controls({ media, label, dark, children }: { media: React.RefObject<HTMLMediaElement | null>; label: string; dark?: boolean; children?: React.ReactNode }) {
  const { playing, time, duration, muted } = useMediaState(media)
  const m = () => media.current
  return (
    <div className={cn("flex items-center gap-1", dark && "bg-inverse px-1 text-fg-inverse")}>
      <ControlButton label={playing ? `Pause ${label}` : `Play ${label}`} dark={dark} onClick={() => (m()?.paused ? m()?.play().catch(() => {}) : m()?.pause())}>
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </ControlButton>
      <Slider.Root
        value={time}
        max={duration || 1}
        step={1}
        disabled={!duration}
        onValueChange={(v) => {
          const el = m()
          if (el) el.currentTime = v
        }}
        className="mx-2 min-w-16 flex-1"
      >
        <Slider.Control className="flex h-11 cursor-pointer touch-none items-center data-disabled:cursor-default">
          <Slider.Track className={cn("relative h-1.5 w-full rounded-full", dark ? "bg-line-inverse" : "bg-line")}>
            <Slider.Indicator className="rounded-full bg-primary" />
            <Slider.Thumb
              getAriaLabel={() => "Seek"}
              getAriaValueText={() => `${formatDuration(time)} of ${formatDuration(duration)}`}
              className="size-4 rounded-full border-2 border-inverse bg-primary data-disabled:hidden"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <span className={cn("shrink-0 px-1 type-mono tabular-nums", dark ? "text-fg-inverse" : "text-fg-secondary")}>
        {formatDuration(time)}
        <span className="max-sm:hidden"> / {duration ? formatDuration(duration) : "--:--"}</span>
      </span>
      <ControlButton
        label={muted ? "Unmute" : "Mute"}
        dark={dark}
        onClick={() => {
          const el = m()
          if (el) el.muted = !el.muted
        }}
      >
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </ControlButton>
      {children}
    </div>
  )
}

/**
 * Video with custom controls and captions. Until the first play, the poster sits at its native size
 * (archive.org thumbnails are about 180px; stretching them to the player looks broken).
 */
export function VideoPlayer({
  title,
  poster,
  sources,
  captions,
}: {
  title: string
  poster: string
  sources: Source[]
  captions?: { src: string; label: string }
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLDivElement>(null)
  // Without JS the custom controls cannot work, so the browser's own stay available.
  const hydrated = useHydrated()
  const [started, setStarted] = useState(false)
  const [cc, setCc] = useState(false)
  const [full, setFull] = useState(false)

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === box.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  return (
    <div ref={box} className="flex w-full flex-col overflow-hidden rounded-lg bg-inverse">
      <div className="relative aspect-video w-full in-[:fullscreen]:aspect-auto in-[:fullscreen]:min-h-0 in-[:fullscreen]:flex-1">
        <video
          ref={ref}
          controls={!hydrated}
          preload="none"
          playsInline
          onPlay={() => setStarted(true)}
          onClick={() => (ref.current?.paused ? ref.current.play().catch(() => {}) : ref.current?.pause())}
          className="size-full"
          aria-label={title}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          {captions && <track kind="captions" src={captions.src} srcLang="en" label={captions.label} />}
        </video>
        {hydrated && !started && (
          <button type="button" onClick={() => ref.current?.play().catch(() => {})} className="absolute inset-0 flex items-center justify-center">
            <span className="relative">
              <Image src={poster} alt="" width={240} height={180} unoptimized className="h-auto max-h-48 w-auto max-w-60 rounded-sm" />
              <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-surface text-fg shadow-overlay">
                <Play className="size-7" aria-hidden="true" />
              </span>
            </span>
            <span className="sr-only">Play {title}</span>
          </button>
        )}
      </div>
      {hydrated && (
        <Controls media={ref} label={title} dark>
          {captions && (
            <ControlButton
              label="Captions"
              dark
              pressed={cc}
              onClick={() => {
                showCaptions(ref.current, !cc)
                setCc(!cc)
              }}
            >
              {cc ? <Captions aria-hidden="true" /> : <CaptionsOff aria-hidden="true" />}
            </ControlButton>
          )}
          <ControlButton
            label={full ? "Exit full screen" : "Full screen"}
            dark
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())?.catch(() => {})}
          >
            {full ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
          </ControlButton>
        </Controls>
      )}
    </div>
  )
}

export type Track = { src: string; title: string; length?: number }

/** Audio with custom controls plus a track list; plays the next track when one ends. */
export function AudioPlayer({ tracks, poster, title }: { tracks: Track[]; poster: string; title: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const hydrated = useHydrated()
  const [current, setCurrent] = useState(0)
  const play = (i: number) => {
    setCurrent(i)
    // Wait for the new src to render before calling play().
    requestAnimationFrame(() => ref.current?.play().catch(() => {}))
  }
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 md:flex-row md:p-6">
      <Image src={poster} alt="" width={180} height={180} unoptimized className="size-32 shrink-0 rounded-md object-cover md:size-44" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="type-label text-fg-secondary">
          Now playing: <span className="text-fg">{tracks[current]?.title}</span>
        </p>
        <audio
          ref={ref}
          src={tracks[current]?.src}
          controls={!hydrated}
          preload="none"
          onEnded={() => current < tracks.length - 1 && play(current + 1)}
          className="w-full"
          aria-label={`${title}: ${tracks[current]?.title}`}
        />
        {hydrated && <Controls media={ref} label={tracks[current]?.title ?? title} />}
        <ol className="max-h-80 overflow-y-auto border-t border-line-subtle" aria-label="Tracks">
          {tracks.map((t, i) => (
            <li key={t.src} className="border-b border-line-subtle">
              <button
                type="button"
                onClick={() => play(i)}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 px-2 text-left type-body-sm hover:bg-sunken",
                  i === current && "font-semibold"
                )}
              >
                <span className="w-6 shrink-0 type-mono text-fg-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.length !== undefined && <span className="type-mono text-fg-muted">{formatDuration(t.length)}</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
