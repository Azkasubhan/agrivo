export type ApiSuccessResponse<T = unknown> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiErrorDetail = {
  field: string;
  issue: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};
