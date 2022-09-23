import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import ContactInline from '../components/ContactInline';

// collect Candidates in Races, collect Races in Guides

const Letters = () => (
  <DefaultLayout title="Letters">
    <div className="page">
      <h1>
        <span role="img" alt="writing" aria-label="writing">
          ✍️
        </span>{' '}
        Letters to an Editor
      </h1>
      <p>
        Tri-Cities Vote invites you to write a public{' '}
        <em>Letter to an Editor</em> sharing your thoughts on local political
        candidates for consideration among our <a href="/">election guide</a>{' '}
        links.
      </p>

      <h2>Why does this matter?</h2>
      <p>
        Individual endorsements are extremely helpful in constructing a
        multi-dimensional picture of a candidate. In this spirit, letters to the
        editor have long been considered a key public forum of the democratic
        process.
      </p>
      <p>
        But the public forum has expanded well beyond the editorial section of
        local newspapers. People make these kinds of endorsements in other
        channels where they get instant feedback and sometimes a larger
        audience.
      </p>
      <p>
        Once central, the formal letter-to-the-editor has been put in the corner
        rocking chair of public discourse—still present, but primarily replaced
        by social media posts. Who needs to write a letter to the editor in an
        era where we can all just publish our own opinions?
      </p>
      <p>
        What we miss by seeing these kinds of endorsements primarily on social
        media is exposure to a wide-open diversity of opinion and viewpoints.
        Social media gradually relegates us to silos of comfortable and
        like-minded opinions, accelerating our polarization.
      </p>

      <h2>How to write a letter to an editor</h2>
      <p>
        Tri-Cities Votes will consider linking to any public “letter to an
        editor” published via blog, website, or social media.
      </p>
      <p>
        We choose to link letters based on their ability to provide a factual,
        constructive, and reasoned argument for or against a candidate. We will
        not censor letters based on viewpoint.
      </p>
      <p>
        You can either send an email with a link to the letter to{' '}
        <a href="mailto:letters@triciti.es">letters@triciti.es</a> or tag{' '}
        <a href="https://www.facebook.com/tricitiesdailynews/">
          Tri-Cities Daily
        </a>{' '}
        in a comment so we see it. (We‘ll give it a like so you know we received
        it and will consider it.) In order to include a Facebook post for
        consideration, the visibility of the post must be{' '}
        <a href="https://www.facebook.com/help/120939471321735?helpref=search&sr=14&query=make%20a%20post%20public">
          set to public
        </a>
        . You may also wish to{' '}
        <a href="https://www.facebook.com/help/1625371524453896?helpref=search&sr=2&query=make%20a%20post%20public">
          restrict who can comment on your public posts
        </a>
        .
      </p>
      <p>
        We encourage you to also{' '}
        <a href="https://www.tri-cityherald.com/opinion/letters-to-the-editor/submit-letter/">
          submit your letter to the Tri-City Herald
        </a>
      </p>
    </div>
    <ContactInline page="https://tricitiesvote.com/letters" />
  </DefaultLayout>
);

export default Letters;
