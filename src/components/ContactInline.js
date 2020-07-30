import React from 'react';

const ContactInline = () => {
  return (
    <form
      name="Contact Inline"
      className="content-narrower contact-form"
      action="/thanks"
      method="post"
      data-netlify="true"
      netlify-honeypot="company"
    >
      <h2>Have feedback?</h2>
      <p>
        This site is a community effort maintained by volunteers. If you see
        something inaccurate or information missing, let us know asap. You can
        drop a note in the contact form or email us at{' '}
        <a href="mailto:guide@triciti.es">guide@triciti.es</a>
      </p>
      <p className="hidden">
        <label>
          Fake company <input name="company" />
        </label>
      </p>
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
      </fieldset>
    </form>
  );
};

export default ContactInline;
