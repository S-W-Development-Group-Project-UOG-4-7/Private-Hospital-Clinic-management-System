import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Billing from './Billing';

jest.mock('../../api/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('Admin Billing Page', () => {
  it('renders billing page title', async () => {
    render(<Billing />);
    await waitFor(() => {
      expect(screen.getByText(/Billing/i)).toBeInTheDocument();
    });
  });
});
