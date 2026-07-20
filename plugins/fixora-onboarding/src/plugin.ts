import {
  createFrontendPlugin,
  PageBlueprint,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import AddBoxIcon from '@material-ui/icons/AddBox';
import React from 'react';

const onboardingRouteRef = createRouteRef();

const onboardingPage = PageBlueprint.make({
  params: {
    path: '/app-onboarding',
    title: 'App Onboarding',
    icon: React.createElement(AddBoxIcon),
    routeRef: onboardingRouteRef,
    loader: async () => {
      const { OnboardingPage } = await import('./components/OnboardingPage');
      return React.createElement(OnboardingPage);
    },
  },
});

export const fixoraOnboardingPlugin = createFrontendPlugin({
  pluginId: 'fixora-onboarding',
  extensions: [onboardingPage],
});
