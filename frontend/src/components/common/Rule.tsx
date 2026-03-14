import { ruleStyle } from '../../design/components'

interface RuleProps {
  style?: React.CSSProperties
}

export default function Rule({ style: extraStyle }: RuleProps) {
  return <hr style={{ ...ruleStyle, ...extraStyle }} />
}
