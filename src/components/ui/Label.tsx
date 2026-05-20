import type { LabelHTMLAttributes } from 'react'

export default function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-gray-700 mb-1 ${props.className ?? ''}`}
    />
  )
}
