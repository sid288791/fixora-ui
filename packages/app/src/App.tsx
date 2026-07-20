import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import fixoraDashboardPlugin from '@internal/plugin-fixora-dashboard';
import fixoraOnboardingPlugin from '@internal/plugin-fixora-onboarding';

export default createApp({
  features: [
    catalogPlugin,
    navModule,
    fixoraDashboardPlugin,
    fixoraOnboardingPlugin,
  ],
});
