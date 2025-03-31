export interface ApiResponse<T> {
    data: T;
  }
  
  export interface ApiError {
    message: string;
    path: string;
    error: unknown;
  }