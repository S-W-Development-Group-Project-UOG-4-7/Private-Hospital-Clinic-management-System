import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Settings from './Settings';

jest.mock('../../api/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        appointment: { slot_length_minutes: 15, cancellation_window_hours: 24 },
        fees: { consultation: 0, lab_markup_percent: 0, pharmacy_markup_percent: 0 },
      },
    }),
    put: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('Admin Settings Page', () => {
  it('renders settings title', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });
});
