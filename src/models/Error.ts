export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message?: string, statusCode?: number, data?: unknown) {
    super(message ?? 'No message');
    this.name = 'ApiError';
    this.statusCode = statusCode ?? 500;
    this.data = data;
  }
}

export class RedirectError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message?: string, statusCode?: number, data?: unknown) {
    super(message ?? 'No message');
    this.name = 'RedirectError';
    this.statusCode = statusCode ?? 500;
    this.data = data;
  }
}
