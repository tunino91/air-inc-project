import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/board";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return (
      (error.response?.data as ApiErrorResponse | undefined)?.error?.message ?? fallback
    );
  }

  return fallback;
};
