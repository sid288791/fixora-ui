import {
  createFrontendPlugin,
  PageBlueprint,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import DashboardIcon from '@material-ui/icons/Dashboard';
import React from 'react';

const dashboardRouteRef = createRouteRef();

const dashboardPage = PageBlueprint.make({
  params: {
    path: '/dashboard',
    title: 'Dashboard',
    icon: React.createElement(DashboardIcon),
    routeRef: dashboardRouteRef,
    loader: async () => {
      const { DashboardPage } = await import('./components/DashboardPage');
      return React.createElement(DashboardPage);
    },
  },
});

export const fixoraDashboardPlugin = createFrontendPlugin({
  pluginId: 'fixora-dashboard',
  extensions: [dashboardPage],
});
