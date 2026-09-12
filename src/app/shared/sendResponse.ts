import { Response } from "express";

interface iResponseData<T> {
  htttpStatusCode: number;
  success: true;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  responseData: iResponseData<T>,
) => {
  const { htttpStatusCode, success, message, data } = responseData;
  res.status(htttpStatusCode).json({
    success,
    message,
    data,
  });
};
