import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 60000,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off'
  }
};

export default config;
