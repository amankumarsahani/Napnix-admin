import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

vi.mock('../../api/index', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

import { authAPI } from '../../api/index';

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.name : 'none'}</span>
      <span data-testid="token">{auth.token || 'none'}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <button onClick={() => auth.login('test@test.com', 'pass123')}>Login</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children inside AuthProvider', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    function BadConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );
  });

  it('login success stores token and user in localStorage', async () => {
    const mockUser = { name: 'John', email: 'john@test.com' };
    const mockToken = 'abc123token';
    authAPI.login.mockResolvedValueOnce({ token: mockToken, user: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(authAPI.login).toHaveBeenCalledWith('test@test.com', 'pass123');
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    expect(screen.getByTestId('user')).toHaveTextContent('John');
  });

  it('login failure returns error message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    let loginResult;
    function LoginTester() {
      const auth = useAuth();
      return (
        <button
          onClick={async () => {
            loginResult = await auth.login('bad@test.com', 'wrong');
          }}
        >
          Login
        </button>
      );
    }

    render(
      <AuthProvider>
        <LoginTester />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(loginResult).toEqual({
      success: false,
      message: 'Invalid credentials',
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logout clears localStorage and resets state', async () => {
    const mockUser = { name: 'John', email: 'john@test.com' };
    const mockToken = 'abc123token';
    authAPI.login.mockResolvedValueOnce({ token: mockToken, user: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Login first
    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    // Now logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});
