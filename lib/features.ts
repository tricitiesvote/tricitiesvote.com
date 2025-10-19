export const SHOW_UNCONTESTED_RACES =
  process.env.NEXT_PUBLIC_SHOW_UNCONTESTED === 'true'

export const HIDE_PARTIAL_TCV_RESPONSES =
  process.env.NEXT_PUBLIC_HIDE_PARTIAL_TCV_RESPONSES !== 'false'

const defaultPartialHideExceptions = [
  'richland-city-council-position-3'
]

const envPartialHideExceptions = (process.env.NEXT_PUBLIC_TCV_PARTIAL_HIDE_EXCEPTIONS ?? '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

export const TCV_PARTIAL_HIDE_EXCEPTIONS = new Set(
  [...defaultPartialHideExceptions, ...envPartialHideExceptions].map(value => value.toLowerCase())
)
