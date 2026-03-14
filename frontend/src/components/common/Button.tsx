import { useState } from 'react'
import { motion } from 'framer-motion'
import { textStyle } from '../../design/typography'
import { transition } from '../../design/motion'
import { buttonStyle, buttonHoverStyle } from '../../design/components'

interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

export default function Button({ label, onClick, disabled = false, size = 'md', style: extraStyle }: ButtonProps) {
  const [hovered, setHovered] = useState(false)

  const paddingY = size === 'sm' ? 10 : 14
  const paddingX = size === 'sm' ? 20 : 32

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: disabled ? 0.4 : 1 }}
      transition={transition.fadeIn}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyle,
        ...(hovered && !disabled ? buttonHoverStyle : {}),
        ...textStyle.caption,
        padding: `${paddingY}px ${paddingX}px`,
        ...extraStyle,
      }}
    >
      {label}
    </motion.button>
  )
}
