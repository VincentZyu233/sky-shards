import { createContext, useContext, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { getServerZone } from '../data/server';
import { useSettings } from './Settings';

export interface Now {
  local: DateTime;
  application: DateTime;
}

export const NowContext = createContext<Now>({
  local: DateTime.now(),
  application: DateTime.now().setZone('America/Los_Angeles'),
});

export const useNow = () => useContext(NowContext);
export const NowConsumer = NowContext.Consumer;

export function NowProvider({ children }: { children: React.ReactNode }) {
  const { server } = useSettings();
  const [local, setLocal] = useState(DateTime.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setLocal(DateTime.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const application = local.setZone(getServerZone(server));
  return <NowContext.Provider value={{ local, application }}>{children}</NowContext.Provider>;
}
