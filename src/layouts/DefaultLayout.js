import React from 'react';
import Helmet from 'react-helmet';
import Nav from '../components/Nav';

// import '../styl/main.styl';

export default props => {
  const {
    pageDescription,
    pageTitle,
    bodyClass,
    children,
    url,
    preview,
  } = props;
  return (
    <>
      <Helmet>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="chrome-1" />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="" />
        <meta name="author" content="Tri-Cities Vote" />
        <meta property="og:site_name" content="Tri-Cities Vote" />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content="A nonpartisan community-driven collection of information to help you decide."
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://tricitiesvote.com/${url}`} />
        {preview ? (
          <meta property="og:image" content={preview} />
        ) : (
          <meta
            property="og:image"
            content="https://tricitiesvote.com/images/tcv-general.png"
          />
        )}
        <title>
          {pageTitle ? `${pageTitle} — ` : ''}
          Tri-Cities Election Guide
        </title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%22100%22>🗳</text></svg>"
        />
        <body className={bodyClass} />
      </Helmet>
      <main>
        <Nav />
        {/* <Link to="/">Home</Link> */}
        {children}
      </main>
    </>
  );
};
