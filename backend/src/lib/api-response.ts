export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
};

export function successResponse<T>(data: T, message = "OK"): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    message,
  };
}

export function errorResponse(error: string, message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
    message,
  };
}

