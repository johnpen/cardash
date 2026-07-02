'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  level: LogLevel;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (message: string, level?: LogLevel) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

let logId = 0;

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogLevel = 'log') => {
    const newLog: LogEntry = {
      id: logId++,
      timestamp: new Date(),
      message,
      level,
    };
    setLogs((prevLogs) => [newLog, ...prevLogs]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);
  
  const contextValue = useMemo(() => ({
    logs,
    addLog,
    clearLogs,
  }), [logs, addLog, clearLogs]);

  return (
    <LogContext.Provider value={contextValue}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    // This fallback allows server components to call `useLog` without crashing,
    // though the logging functions will have no effect.
    // This is a pragmatic choice to avoid complex client/server boundary issues
    // for a simple debug logging feature.
    return {
        logs: [],
        addLog: (message: string, level: LogLevel = 'log') => {
            // In a server context, this does nothing.
            // On the server, you can use standard console.log for debugging if needed.
            if(process.env.NODE_ENV === 'development') {
                console.log(`[${level.toUpperCase()}] (SERVER): ${message}`);
            }
        },
        clearLogs: () => {},
    }
  }
  return context;
};
