export function ContactInline() {
  return (
    <form className="feedback-form">
      <h2 id="feedback">HAVE FEEDBACK?</h2>
      <p>
        This site is a community effort maintained by volunteers. If you see something
        inaccurate or information missing,{' '}
        <a href="mailto:guide@tricitiesvote.com">let us know asap</a>.
      </p>
      <p>
        Oh and{' '}
        <a href="https://github.com/tricitiesvote/tricitiesvote.com" target="_blank" rel="noopener noreferrer">
          the entire site is open source
        </a>
        . Feel free to contribute!
      </p>
    </form>
  )
}