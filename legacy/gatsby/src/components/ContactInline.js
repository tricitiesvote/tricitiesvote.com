import React from 'react';

const ContactInline = props => {
  const { page } = props;
  return (
    <form
      name="Feedback"
      action="/thanks"
      method="post"
      data={page}
      data-netlify="true"
    >
      <h2 id="feedback">Have feedback?</h2>
      <p>
        This site is a community effort maintained by volunteers. If you see
        something inaccurate or information missing,{' '}
        <a href="mailto:guide@tricitiesvote.com">let us know asap</a>.
      </p>
      <p>
        Oh and{' '}
        <a href="https://github.com/tricitiesvote/tricitiesvote.com">
          the entire site is open source
        </a>
        . Feel free to contribute!
      </p>
      {/* <input type="hidden" id="fieldPage" name="page" value={page} />
      <fieldset>
        <div className="form-element">
          <label htmlFor="fieldName">Your Name* </label>
          <input
            className="form-input"
            id="fieldName"
            name="name"
            type="text"
            required="required"
          />
        </div>
        <div className="form-element">
          <label htmlFor="fieldEmail">Your Email* </label>
          <input
            className="form-input"
            id="fieldEmail"
            name="email"
            type="email"
            required="required"
          />
        </div>
        <div className="form-element">
          <label htmlFor="fieldMessage">Message </label>
          <textarea
            className="form-input"
            id="fieldMessage"
            name="message"
            type="textarea"
          />
        </div>
        <div className="form-element">
          <input
            className="button button-primary animated"
            type="submit"
            value="Send"
          />
        </div>
      </fieldset> */}
    </form>
  );
};

export default ContactInline;
