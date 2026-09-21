import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { StatsService } from "./stats.service";
import { AppError } from "../../errorHelpers/appError";

const getDashboardStatsData = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const result = await StatsService.getDashboardStatsData(user);

    sendResponse(res, {
      htttpStatusCode: status.OK,
      success: true,
      message: "Stats data retrieved successfully!",
      data: result,
    });
  },
);

export const StatsController = {
  getDashboardStatsData,
};
