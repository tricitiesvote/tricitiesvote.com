import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'gatsby';

// import '../styl/main.styl';

export default props => {
  const {
    pageDescription,
    pageTitle,
    bodyClass,
    children,
  } = props;
  return (
    <>
      <Helmet>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="chrome-1" />
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content=""
        />
        <meta name="author" content="Tumbleweird, SPC" />
        <title>
          {pageTitle ? `${pageTitle} — ` : ''}
          Tri-Cities Election Guide
        </title>
        {/* <link rel="shortcut icon" href="" /> */}

        {/* <link rel="stylesheet" href="/css/main.css" /> */}

        <body className={bodyClass} />
      </Helmet>
      <main>
        <Link to="/">Home</Link>
        {children}
      </main>
    </>
  );
};
