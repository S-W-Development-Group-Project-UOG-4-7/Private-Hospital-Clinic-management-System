import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom for the test environment (avoids ESM resolution issues with v7+)
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    __esModule: true,
    BrowserRouter: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Route: () => null,
    Navigate: () => null,
  };
});

import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.queryByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
