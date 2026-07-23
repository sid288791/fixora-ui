import {
  createFrontendPlugin,
  PageBlueprint,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import DashboardIcon from '@material-ui/icons/Dashboard';
import NotificationsIcon from '@material-ui/icons/Notifications';
import React from 'react';

const dashboardRouteRef = createRouteRef();
const alertConfigRouteRef = createRouteRef();

const dashboardPage = PageBlueprint.make({
  name: 'dashboard',
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

const alertConfigPage = PageBlueprint.make({
  name: 'alert-config',
  params: {
    path: '/alerts/:appId',
    title: 'Alert & Notifications',
    icon: React.createElement(NotificationsIcon),
    routeRef: alertConfigRouteRef,
    loader: async () => {
      const { AlertConfigPage } = await import('./components/AlertConfigPage');
      return React.createElement(AlertConfigPage);
    },
  },
});

export const fixoraDashboardPlugin = createFrontendPlugin({
  pluginId: 'fixora-dashboard',
  extensions: [dashboardPage, alertConfigPage],
});
