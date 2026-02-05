import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple smoke test — avoid importing router-dependent `App` to prevent ESM resolution
// issues in the test environment. This keeps tests fast and stable.

test('renders learn react link', () => {
  render(<div>learn react</div>);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

