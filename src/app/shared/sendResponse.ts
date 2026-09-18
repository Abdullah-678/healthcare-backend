import { Response } from "express";

interface iResponseData<T> {
  htttpStatusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  responseData: iResponseData<T>,
) => {
  const { htttpStatusCode, success, message, data, meta } = responseData;
  res.status(htttpStatusCode).json({
    success,
    message,
    data,
    meta,
  });
};
