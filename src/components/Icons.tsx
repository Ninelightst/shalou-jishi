interface IconProps {
  size?: number
}

function Svg({ size = 20, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function HomeIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </Svg>
  )
}

export function ClockIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Svg>
  )
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  )
}

export function ChartIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </Svg>
  )
}

export function PlusIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function TrashIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  )
}

export function CloseIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  )
}

export function ChevronLeftIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  )
}

export function ChevronRightIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  )
}

export function SunIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  )
}

export function MoonIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  )
}

export function PlayIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M5 3l14 9-14 9V3z" />
    </Svg>
  )
}

export function PauseIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" />
    </Svg>
  )
}

export function StopIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </Svg>
  )
}

export function GearIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </Svg>
  )
}

export function DownloadIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </Svg>
  )
}

export function TreeIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 3l5 7h-3l3 5H7l3-5H7l5-7z" />
      <path d="M12 15v7" />
    </Svg>
  )
}

export function UploadIcon({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </Svg>
  )
}
