import { createContext, useContext, useMemo } from 'react';
import { getQualitySettings, type QualitySettings } from '../utils/quality';

const QualityContext = createContext<QualitySettings>(getQualitySettings('high'));

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const settings = useMemo(() => {
    try {
      return getQualitySettings();
    } catch {
      return getQualitySettings('high');
    }
  }, []);

  return (
    <QualityContext.Provider value={settings}>
      {children}
    </QualityContext.Provider>
  );
}

export function useQuality(): QualitySettings {
  return useContext(QualityContext);
}
