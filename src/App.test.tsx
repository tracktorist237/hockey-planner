import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('src/components/DebugOverlay', () => ({
  DebugOverlay: () => null,
}));

test('renders the sign-in page for an unauthenticated visitor', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
});
