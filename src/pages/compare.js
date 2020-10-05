import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import CompareKey from '../components/CompareKey';
import CompareStatements from '../components/CompareStatements';

export default () => (
  <DefaultLayout title="Compare Legislators">
	<CompareHeader />
	<CompareKey />
	<CompareStatements />
  </DefaultLayout>
);
