import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
          <h1>React Crashed: Something went wrong</h1>
          <p>This red screen means the application encountered a fatal error during rendering.</p>
          <pre style={{ backgroundColor: 'black', color: 'red', padding: '10px', overflow: 'auto', marginTop: '20px' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ backgroundColor: 'black', color: 'white', padding: '10px', overflow: 'auto', marginTop: '10px', flex: 1 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
