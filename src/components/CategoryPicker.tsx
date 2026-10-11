import type { Category } from '../types'

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="cat-picker">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`chip ${value === c.id ? 'active' : ''}`}
          onClick={() => onChange(c.id)}
        >
          <span className="dot" style={{ background: c.color }} />
          {c.name}
        </button>
      ))}
    </div>
  )
}
