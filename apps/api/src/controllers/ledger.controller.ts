import { Request, Response, NextFunction } from "express";
import { ledgerService } from "../services/ledger.service.js";

export class LedgerController {
  async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const currentUserId = req.user!.id;
      const expense = await ledgerService.createExpense(
        tripId,
        currentUserId,
        req.body,
      );
      res.status(201).json({
        message: "Expense recorded successfully",
        expense,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTripExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const currentUserId = req.user!.id;
      const expenses = await ledgerService.getTripExpenses(
        tripId,
        currentUserId,
      );
      res.status(200).json({ expenses });
    } catch (err) {
      next(err);
    }
  }

  async getExpenseById(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const expenseId = req.params.expenseId as string;
      const currentUserId = req.user!.id;
      const expense = await ledgerService.getExpenseById(
        tripId,
        expenseId,
        currentUserId,
      );
      res.status(200).json({ expense });
    } catch (err) {
      next(err);
    }
  }

  async getTripBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const currentUserId = req.user!.id;
      const balances = await ledgerService.getTripBalances(
        tripId,
        currentUserId,
      );
      res.status(200).json({ balances });
    } catch (err) {
      next(err);
    }
  }

  async simplifyDebts(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const currentUserId = req.user!.id;
      const result = await ledgerService.simplifyDebts(tripId, currentUserId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async settleDebt(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const currentUserId = req.user!.id;
      const settlement = await ledgerService.settleDebt(
        tripId,
        currentUserId,
        req.body,
      );
      res.status(201).json({
        message: "Settlement recorded successfully",
        settlement,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ledgerController = new LedgerController();
