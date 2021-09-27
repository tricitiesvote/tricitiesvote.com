import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';

export default () => (
  <DefaultLayout title="About">
    <div className="page">
      <h1>About tricitiesvote.com</h1>
      <p>
        Starting in recent years, I’ve had several conversations with people who
        don’t normally vote in local elections. Based on that input, some ideas
        from Davin Diaz, and a lot more feedback from folks along the way, a few
        of us put together{' '}
        <a href="https://tricities.netlify.app/election/kennewick">
          a guide for 2019’s city council elections
        </a>
        .
      </p>
      <p>
        In 2020, that guide became{' '}
        <a href="https://2020.tricitiesvote.com">
          a much larger group effort—now as ‘the tricitiesvote.com guide’
        </a>
        .
      </p>
      <p>
        I want to give a huge thanks to Sara Quinn, Erik Rotness, Ted Miller,
        Kristi Shumway, Jeff Kissel, Reka Robinson, Justin Raffa, Steven Ghan,
        Davin Diaz, Jenneke Heerink, Sarah Avenir, John Roach, and the long list
        of people who’ve contributed input and feedback along the way.
      </p>
      <p>
        We’re always working to sustainably grow the process and increase the
        range of people involved.
      </p>
      <p>
        Based on feedback so far, voters tend to love the tricitiesvote.com
        guide, challenger candidates tend to like it, and incumbents tend to...
        not... love it.
      </p>
      <p>
        And we get it. It’s hard to fill out a form where there’s little room
        for nuance, and no political middle-of-the-road ‘safe’ answers, where
        candidates have to choose between two statements that aren’t their
        words.
      </p>
      <p>
        But as Davin told me a few years ago, that’s what voting nearly always
        is—whether in office or in the voting booth—choices between options you
        didn’t come up with.
      </p>
      <p>No shrugs allowed for voters or candidates—just decisions.</p>
      <p>Godspeed.</p>
      <p>—Adam Avenir</p>
    </div>
  </DefaultLayout>
);
