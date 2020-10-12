import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import CompareCommissioners from '../components/compare/CompareCommissioners';
import CompareCommissionersKey from '../components/compare/CompareCommissionersKey';

export default () => (
  <DefaultLayout title="Compare Legislators">
    <CompareHeader>
      <CompareCommissionersKey />
    </CompareHeader>
    <CompareCommissioners />
  </DefaultLayout>
);
