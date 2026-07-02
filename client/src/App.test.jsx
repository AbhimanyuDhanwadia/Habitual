import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

describe('App component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
