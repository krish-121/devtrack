export type HealthResponse = {
  data: {
    status: 'ok';
  };
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};
