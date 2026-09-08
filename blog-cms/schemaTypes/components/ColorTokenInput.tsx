/**
 * ColorTokenInput
 *
 * Renders a <select> dropdown populated from Site Settings → Theme Colors.
 * Each option shows a color swatch square + the color label.
 * The stored value is just the label string (e.g. "Brand Red").
 */
import { useCallback, useEffect, useState } from 'react'
import { set, unset } from 'sanity'
import type { StringInputProps } from 'sanity'
import { useClient } from 'sanity'

interface ThemeColorEntry {
  label: string
  value: { hex: string; rgb?: { r: number; g: number; b: number; a: number } }
}

const QUERY = `*[_type=="sitesettings"][0].themeColors[]{
  label,
  value{ hex, rgb{ r, g, b, a } }
}`

function toCSS(entry: ThemeColorEntry): string {
  const { rgb, hex } = entry.value ?? {}
  if (rgb) return `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a ?? 1})`
  return hex ?? '#ccc'
}

export function ColorTokenInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  const [colors, setColors] = useState<ThemeColorEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .fetch<ThemeColorEntry[]>(QUERY)
      .then((data) => setColors(data ?? []))
      .finally(() => setLoading(false))
  }, [client])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.currentTarget.value
      if (!v) {
        onChange(unset())
      } else {
        onChange(set(v))
      }
    },
    [onChange],
  )

  // selected entry for preview swatch
  const selected = colors.find((c) => c.label === value)

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      {/* Color preview swatch */}
      <span
        style={{
          display: 'inline-block',
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 6,
          background: selected ? toCSS(selected) : 'transparent',
          border: '1.5px solid rgba(255,255,255,0.18)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'background 0.2s',
        }}
      />

      {/* Select dropdown */}
      <select
        value={value ?? ''}
        onChange={handleChange}
        disabled={readOnly || loading}
        style={{
          flex: 1,
          height: 36,
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 6,
          border: '1.5px solid rgba(255,255,255,0.15)',
          background: '#1a1f2e',
          color: loading ? '#64748b' : '#f1f5f9',
          fontSize: 14,
          cursor: readOnly ? 'not-allowed' : 'pointer',
          outline: 'none',
          appearance: 'auto',
        }}
      >
        <option value="">
          {loading ? 'Loading colors…' : '— None —'}
        </option>

        {!loading && colors.length === 0 && (
          <option disabled value="">
            No colors in Site Settings yet
          </option>
        )}

        {colors.map((entry) => (
          <option key={entry.label} value={entry.label}>
            {entry.label}  ({entry.value?.hex ?? ''})
          </option>
        ))}
      </select>
    </div>
  )
}
