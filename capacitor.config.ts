import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cunchao.app',
  appName: '村超',
  webDir: 'apps/web/dist',
  server: {
    url: 'https://cunchao-static.vercel.app',
    cleartext: false
  }
};

export default config;
