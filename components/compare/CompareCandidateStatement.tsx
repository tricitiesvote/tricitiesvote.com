'use client'

import Image from 'next/image'
import { KeyboardEvent, useState } from 'react'

interface CompareCandidateStatementProps {
  name: string
  image?: string | null
  comment?: string | null
}

export function CompareCandidateStatement({
  name,
  image,
  comment
}: CompareCandidateStatementProps) {
  const [open, setOpen] = useState(false)

  const lastName = name.split(' ').filter(Boolean).pop() ?? name
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isRemoteImage = image ? /^https?:/i.test(image) : false

  const toggle = () => {
    if (!comment) return
    setOpen(prev => !prev)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!comment) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  const classes = ['pos']
  if (comment?.trim()) {
    classes.push('has-comment')
  }
  if (open) {
    classes.push('show')
  }

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      aria-expanded={open}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={50}
          height={50}
          sizes="50px"
          unoptimized={isRemoteImage}
        />
      ) : (
        <span className="pos-placeholder">{initials}</span>
      )}
      <h5>{lastName}</h5>
      {comment && (
        <div className="more">
          <span className="close" />
          <p className="says">{comment}</p>
        </div>
      )}
    </button>
  )
}
