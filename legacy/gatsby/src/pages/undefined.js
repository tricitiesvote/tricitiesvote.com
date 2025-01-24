import React from 'react';

import DefaultLayout from '../layouts/DefaultLayout';

class NotFoundPage extends React.Component {
  render() {
    const siteTitle = 'Tri-Cities Vote';

    return (
      <DefaultLayout title={siteTitle} url="">
        <h1>Not Found</h1>
        <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
      </DefaultLayout>
    );
  }
}

export default NotFoundPage;
