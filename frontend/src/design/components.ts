import { colors } from './theme'

export const buttonStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border.subtle}`,
  color: colors.text.secondary,
  borderRadius: 0,
  cursor: 'pointer',
  transition: 'color 0.6s ease, border-color 0.6s ease',
}

export const buttonHoverStyle: React.CSSProperties = {
  borderColor: colors.border.emphasis,
  color: colors.accent.silver,
}

export const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${colors.border.subtle}`,
  borderRadius: 0,
  color: colors.text.primary,
  outline: 'none',
  transition: 'border-color 0.6s ease',
}

