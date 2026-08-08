import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface IntercomAlert {
  id: string;
  sender: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
}

interface IntercomContextType {
  alerts: IntercomAlert[];
  sendAlert: (sender: string, message: string, severity?: AlertSeverity) => void;
  dismissAlert: (id: string) => void;
}

const IntercomContext = createContext<IntercomContextType | undefined>(undefined);

export const IntercomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<IntercomAlert[]>([]);

  const sendAlert = (sender: string, message: string, severity: AlertSeverity = 'info') => {
    const newAlert: IntercomAlert = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      message,
      severity,
      timestamp: Date.now(),
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <IntercomContext.Provider value={{ alerts, sendAlert, dismissAlert }}>
      {children}
    </IntercomContext.Provider>
  );
};

export const useIntercom = () => {
  const context = useContext(IntercomContext);
  if (context === undefined) {
    throw new Error('useIntercom must be used within an IntercomProvider');
  }
  return context;
};
