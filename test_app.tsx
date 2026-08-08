
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

try {
  renderToString(<App />);
  console.log('App rendered successfully');
} catch(e) {
  console.error('App crash:', e);
}

