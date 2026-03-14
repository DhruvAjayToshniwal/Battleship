import { panelStyle } from '../../design/components'
import { space } from '../../design/spacing'

interface PanelProps {
  children: React.ReactNode
  padding?: number
  style?: React.CSSProperties
}

export default function Panel({ children, padding = space.lg, style: extraStyle }: PanelProps) {
  return (
    <div
      style={{
        ...panelStyle,
        padding,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  )
}
