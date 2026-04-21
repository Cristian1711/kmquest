import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kmquest.app',
  appName: 'KM Quest',
  webDir: 'src',
  plugins: {
    Health: {
      healthSharePermission: "Necesitamos acceso a Apple Health para leer tus pasos y km",
      healthUpdatePermission: "Para guardar tus sesiones en Apple Health"
    }
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true
  }
};

export default config;
