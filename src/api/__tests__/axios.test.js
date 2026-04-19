import { describe, it, expect, vi, beforeEach } from 'vitest';

let requestFulfilled;
let responseRejected;

vi.mock('axios', () => {
  const instance = {
    defaults: { baseURL: 'http://localhost:5000/api' },
    interceptors: {
      request: {
        use: vi.fn((onFulfilled) => {
          requestFulfilled = onFulfilled;
        }),
      },
      response: {
        use: vi.fn((_onFulfilled, onRejected) => {
          responseRejected = onRejected;
        }),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => instance),
      post: vi.fn(),
    },
  };
});

beforeEach(async () => {
  localStorage.clear();
  await import('../axios');
});

describe('axios interceptors', () => {
  it('request interceptor adds Authorization header from localStorage', () => {
    localStorage.setItem('token', 'my-test-token');

    const config = { headers: {} };
    const result = requestFulfilled(config);

    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('request interceptor skips header when no token', () => {
    const config = { headers: {} };
    const result = requestFulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('401 response on auth endpoint does NOT trigger refresh (just rejects)', async () => {
    const error = {
      config: { url: '/auth/signin', _retry: false },
      response: { status: 401 },
    };

    await expect(responseRejected(error)).rejects.toBe(error);
  });
});
