import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import CompareStatements from '../components/CompareStatements';
import CompareLegislators from '../components/compare/CompareLegislators';
import CompareLegislatorsKey from '../components/compare/CompareLegislatorsKey';

export default () => (
  <DefaultLayout title="Compare Legislators">
		<CompareHeader>
			<CompareLegislatorsKey />
		</CompareHeader>
		<CompareLegislators />
  </DefaultLayout>
);
