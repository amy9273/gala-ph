import { prisma } from "../lib/prisma.js";
import {
  pesosToCentavos,
  centavosToPesos,
  formatPHP,
  splitAmountEqually,
  solveGreedyDebtGraph,
} from "@gala-ph/shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import { CreateExpenseDto, SettleDebtDto } from "../schemas/ledger.schema.js";

export interface SimplifiedDebtTransaction {
  fromUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  toUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    gcashNumber: string | null;
    mayaNumber: string | null;
  };
  amountCentavos: number;
  amountPesos: number;
  formattedAmount: string;
  suggestedPaymentMethod: "GCASH" | "MAYA" | "CASH";
  qrPayload: {
    recipientName: string;
    recipientMobile: string | null;
    amount: number;
  };
}

export class LedgerService {
  /**
   * Helper: verify user is a member of the trip and return all trip members
   */
  private async getVerifiedTripMembers(tripId: string, userId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                gcashNumber: true,
                mayaNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError("Trip not found.");
    }

    const isMember = trip.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this trip.");
    }

    return { trip, members: trip.members };
  }

  /**
   * Creates an itemized expense with line items, selective consumers,
   * non-drinker/allergy exclusion, and proportional tax/service charge apportionment.
   */
  async createExpense(
    tripId: string,
    currentUserId: string,
    dto: CreateExpenseDto,
  ) {
    const { members } = await this.getVerifiedTripMembers(
      tripId,
      currentUserId,
    );

    const paidById = dto.paidById || currentUserId;
    const isPayerMember = members.some((m) => m.userId === paidById);
    if (!isPayerMember) {
      throw new BadRequestError(
        "The designated payer must be a member of this trip.",
      );
    }

    const memberMap = new Map(members.map((m) => [m.userId, m]));
    const consumerCentavosMap = new Map<string, number>();

    // Initialize all members with 0 owed
    for (const m of members) {
      consumerCentavosMap.set(m.userId, 0);
    }

    const createdItemsData: Array<{
      name: string;
      price: number;
      priceCentavos: number;
      quantity: number;
      consumerUserIds: string[];
    }> = [];

    let totalFoodCentavos = 0;

    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        let consumerIds: string[] = [];

        if (item.consumerUserIds && item.consumerUserIds.length > 0) {
          // Explicit consumers provided
          for (const uid of item.consumerUserIds) {
            if (!memberMap.has(uid)) {
              throw new BadRequestError(
                `Consumer ID "${uid}" is not a member of this trip.`,
              );
            }
          }
          consumerIds = [...new Set(item.consumerUserIds)];
        } else {
          // Automatic resolution
          if (item.isAlcohol || dto.category === "ALCOHOL_AND_BAR") {
            // Exclude non-drinkers
            consumerIds = members
              .filter((m) => !m.isNonDrinker)
              .map((m) => m.userId);
          } else if (dto.vehicleIdOnly) {
            // Filter by carpool vehicle
            consumerIds = members
              .filter((m) => m.vehicleId === dto.vehicleIdOnly)
              .filter((m) => (dto.excludeDriver ? !m.isDriver : true))
              .map((m) => m.userId);
          } else {
            // All members
            consumerIds = members.map((m) => m.userId);
          }
        }

        if (consumerIds.length === 0) {
          throw new BadRequestError(
            `No eligible consumers found for item "${item.name}".`,
          );
        }

        const itemPriceCentavos = pesosToCentavos(item.price);
        const itemTotalCentavos = itemPriceCentavos * item.quantity;
        totalFoodCentavos += itemTotalCentavos;

        // Distribute item cost equally among its consumers with centavo precision
        const splits = splitAmountEqually(
          itemTotalCentavos,
          consumerIds.length,
        );
        for (let i = 0; i < consumerIds.length; i++) {
          const cid = consumerIds[i]!;
          const splitCentavos = splits[i]!;
          const current = consumerCentavosMap.get(cid) || 0;
          consumerCentavosMap.set(cid, current + splitCentavos);
        }

        createdItemsData.push({
          name: item.name,
          price: item.price,
          priceCentavos: itemPriceCentavos,
          quantity: item.quantity,
          consumerUserIds: consumerIds,
        });
      }
    } else {
      // Flat total without items
      let consumerIds: string[] = [];
      if (
        dto.splitMode === "EQUAL_DRINKERS_ONLY" ||
        dto.category === "ALCOHOL_AND_BAR"
      ) {
        consumerIds = members
          .filter((m) => !m.isNonDrinker)
          .map((m) => m.userId);
      } else if (dto.vehicleIdOnly) {
        consumerIds = members
          .filter((m) => m.vehicleId === dto.vehicleIdOnly)
          .filter((m) => (dto.excludeDriver ? !m.isDriver : true))
          .map((m) => m.userId);
      } else {
        consumerIds = members.map((m) => m.userId);
      }

      if (consumerIds.length === 0) {
        throw new BadRequestError(
          "No eligible consumers found for flat expense split.",
        );
      }

      const flatTotalCentavos = pesosToCentavos(dto.totalAmount || 0);
      totalFoodCentavos = flatTotalCentavos;
      const splits = splitAmountEqually(flatTotalCentavos, consumerIds.length);

      for (let i = 0; i < consumerIds.length; i++) {
        const cid = consumerIds[i]!;
        consumerCentavosMap.set(cid, splits[i]!);
      }
    }

    // Apportion Service Charge and Taxes proportionally
    const serviceFeeCentavos = pesosToCentavos(dto.serviceAndTaxFee || 0);
    if (serviceFeeCentavos > 0) {
      if (totalFoodCentavos > 0) {
        // Collect consumers who consumed food
        const participatingConsumers: Array<{
          userId: string;
          foodCentavos: number;
        }> = [];
        for (const [userId, foodCentavos] of consumerCentavosMap.entries()) {
          if (foodCentavos > 0) {
            participatingConsumers.push({ userId, foodCentavos });
          }
        }

        if (participatingConsumers.length > 0) {
          // Proportional distribution
          let allocatedFeeCentavos = 0;
          const feeAllocations: Array<{
            userId: string;
            feeCentavos: number;
            remainderFraction: number;
          }> = [];

          for (const pc of participatingConsumers) {
            const rawFee =
              (serviceFeeCentavos * pc.foodCentavos) / totalFoodCentavos;
            const floorFee = Math.floor(rawFee);
            const remainder = rawFee - floorFee;
            allocatedFeeCentavos += floorFee;
            feeAllocations.push({
              userId: pc.userId,
              feeCentavos: floorFee,
              remainderFraction: remainder,
            });
          }

          // Distribute any leftover centavos based on largest fractional remainders
          const leftoverCentavos = serviceFeeCentavos - allocatedFeeCentavos;
          feeAllocations.sort(
            (a, b) => b.remainderFraction - a.remainderFraction,
          );

          for (let i = 0; i < leftoverCentavos; i++) {
            const allocation = feeAllocations[i % feeAllocations.length]!;
            allocation.feeCentavos += 1;
          }

          // Add apportioned fees to final map
          for (const alloc of feeAllocations) {
            const current = consumerCentavosMap.get(alloc.userId) || 0;
            consumerCentavosMap.set(alloc.userId, current + alloc.feeCentavos);
          }
        }
      } else {
        // If subtotal was 0, split fee equally
        const splits = splitAmountEqually(serviceFeeCentavos, members.length);
        for (let i = 0; i < members.length; i++) {
          const m = members[i]!;
          const current = consumerCentavosMap.get(m.userId) || 0;
          consumerCentavosMap.set(m.userId, current + splits[i]!);
        }
      }
    }

    const totalExpenseCentavos = totalFoodCentavos + serviceFeeCentavos;
    const totalExpensePesos = centavosToPesos(totalExpenseCentavos);

    // Filter consumers who actually owe something (> 0 centavos)
    const activeSplits = Array.from(consumerCentavosMap.entries()).filter(
      ([, centavos]) => centavos > 0,
    );

    // Verify mathematical conservation: sum(splits) === totalExpenseCentavos
    const sumSplits = activeSplits.reduce(
      (acc, [, centavos]) => acc + centavos,
      0,
    );
    if (sumSplits !== totalExpenseCentavos) {
      throw new Error(
        `Split conservation invariant violation: sum(${sumSplits}) !== total(${totalExpenseCentavos})`,
      );
    }

    // Execute atomic persistence in Prisma interactive transaction
    const expense = await prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          tripId,
          paidById,
          title: dto.title,
          category: dto.category,
          totalAmount: totalExpensePesos,
          totalCentavos: totalExpenseCentavos,
          serviceAndTaxFee: centavosToPesos(serviceFeeCentavos),
          receiptUrl: dto.receiptUrl,
          vehicleIdOnly: dto.vehicleIdOnly,
        },
      });

      // Create items and consumers
      for (const itemData of createdItemsData) {
        const createdItem = await tx.expenseItem.create({
          data: {
            expenseId: createdExpense.id,
            name: itemData.name,
            price: itemData.price,
            priceCentavos: itemData.priceCentavos,
            quantity: itemData.quantity,
          },
        });

        for (const consumerId of itemData.consumerUserIds) {
          await tx.itemConsumer.create({
            data: {
              expenseItemId: createdItem.id,
              userId: consumerId,
            },
          });
        }
      }

      // Create splits
      for (const [userId, centavos] of activeSplits) {
        const isSettled = userId === paidById; // The payer has already paid their portion
        await tx.expenseSplit.create({
          data: {
            expenseId: createdExpense.id,
            userId,
            amountOwed: centavosToPesos(centavos),
            amountCentavos: centavos,
            isSettled,
            settledAt: isSettled ? new Date() : null,
          },
        });
      }

      return tx.expense.findUnique({
        where: { id: createdExpense.id },
        include: {
          paidBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          items: {
            include: {
              consumers: {
                include: {
                  user: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  gcashNumber: true,
                  mayaNumber: true,
                },
              },
            },
          },
        },
      });
    });

    if (!expense) {
      throw new Error("Failed to create expense transaction.");
    }

    return {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      paidBy: expense.paidBy,
      totalAmount: Number(expense.totalAmount),
      totalCentavos: expense.totalCentavos,
      formattedTotal: formatPHP(totalExpenseCentavos, true),
      serviceAndTaxFee: Number(expense.serviceAndTaxFee),
      formattedServiceFee: formatPHP(serviceFeeCentavos, true),
      receiptUrl: expense.receiptUrl,
      items: expense.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        formattedPrice: formatPHP(
          item.priceCentavos || pesosToCentavos(Number(item.price)),
          true,
        ),
        consumers: item.consumers.map((c) => ({
          userId: c.userId,
          name: c.user.name,
        })),
      })),
      splits: expense.splits.map((s) => ({
        userId: s.userId,
        name: s.user.name,
        amountOwed: Number(s.amountOwed),
        amountCentavos: s.amountCentavos,
        formattedAmount: formatPHP(
          s.amountCentavos || pesosToCentavos(Number(s.amountOwed)),
          true,
        ),
        isSettled: s.isSettled,
        settledAt: s.settledAt,
      })),
    };
  }

  /**
   * Retrieves all expenses for a trip with full breakdown
   */
  async getTripExpenses(tripId: string, currentUserId: string) {
    await this.getVerifiedTripMembers(tripId, currentUserId);

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: {
        paidBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        items: {
          include: {
            consumers: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                gcashNumber: true,
                mayaNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return expenses.map((exp) => {
      const centavos =
        exp.totalCentavos || pesosToCentavos(Number(exp.totalAmount));
      return {
        id: exp.id,
        title: exp.title,
        category: exp.category,
        paidBy: exp.paidBy,
        totalAmount: Number(exp.totalAmount),
        totalCentavos: centavos,
        formattedTotal: formatPHP(centavos, true),
        serviceAndTaxFee: Number(exp.serviceAndTaxFee),
        createdAt: exp.createdAt,
        itemsCount: exp.items.length,
        splits: exp.splits.map((s) => ({
          userId: s.userId,
          name: s.user.name,
          amountOwed: Number(s.amountOwed),
          formattedAmount: formatPHP(
            s.amountCentavos || pesosToCentavos(Number(s.amountOwed)),
            true,
          ),
          isSettled: s.isSettled,
        })),
      };
    });
  }

  /**
   * Retrieves single expense details
   */
  async getExpenseById(
    tripId: string,
    expenseId: string,
    currentUserId: string,
  ) {
    await this.getVerifiedTripMembers(tripId, currentUserId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        items: {
          include: {
            consumers: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                gcashNumber: true,
                mayaNumber: true,
              },
            },
          },
        },
      },
    });

    if (!expense || expense.tripId !== tripId) {
      throw new NotFoundError("Expense not found.");
    }

    const centavos =
      expense.totalCentavos || pesosToCentavos(Number(expense.totalAmount));
    return {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      paidBy: expense.paidBy,
      totalAmount: Number(expense.totalAmount),
      totalCentavos: centavos,
      formattedTotal: formatPHP(centavos, true),
      serviceAndTaxFee: Number(expense.serviceAndTaxFee),
      receiptUrl: expense.receiptUrl,
      items: expense.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        consumers: item.consumers.map((c) => ({
          userId: c.userId,
          name: c.user.name,
        })),
      })),
      splits: expense.splits.map((s) => ({
        userId: s.userId,
        name: s.user.name,
        amountOwed: Number(s.amountOwed),
        formattedAmount: formatPHP(
          s.amountCentavos || pesosToCentavos(Number(s.amountOwed)),
          true,
        ),
        isSettled: s.isSettled,
      })),
    };
  }

  /**
   * Calculates current member net balances and ledger summaries.
   * NetBalance = (Total Expenses Paid + Total Settlements Transferred)
   *            - (Total Expense Splits Owed + Total Settlements Received)
   */
  async getTripBalances(tripId: string, currentUserId: string) {
    const { members } = await this.getVerifiedTripMembers(
      tripId,
      currentUserId,
    );

    // Fetch all expenses and their splits
    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: { splits: true },
    });

    // Fetch all peer settlements
    const settlements = await prisma.settlement.findMany({
      where: { tripId },
    });

    const memberStatsMap = new Map<
      string,
      {
        user: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
          gcashNumber: string | null;
          mayaNumber: string | null;
        };
        totalPaidCentavos: number;
        totalShareCentavos: number;
      }
    >();

    for (const m of members) {
      memberStatsMap.set(m.userId, {
        user: m.user,
        totalPaidCentavos: 0,
        totalShareCentavos: 0,
      });
    }

    // 1. Account for expenses paid
    for (const exp of expenses) {
      const payerStats = memberStatsMap.get(exp.paidById);
      const expenseCentavos =
        exp.totalCentavos || pesosToCentavos(Number(exp.totalAmount));
      if (payerStats) {
        payerStats.totalPaidCentavos += expenseCentavos;
      }

      // Account for member splits consumed
      for (const split of exp.splits) {
        const consumerStats = memberStatsMap.get(split.userId);
        const splitCentavos =
          split.amountCentavos || pesosToCentavos(Number(split.amountOwed));
        if (consumerStats) {
          consumerStats.totalShareCentavos += splitCentavos;
        }
      }
    }

    // 2. Account for peer-to-peer settlements
    for (const s of settlements) {
      const payerStats = memberStatsMap.get(s.payerId);
      const recipientStats = memberStatsMap.get(s.recipientId);

      // Payer transferred money, increasing their net credit
      if (payerStats) {
        payerStats.totalPaidCentavos += s.amountCentavos;
      }
      // Recipient received money, increasing their consumed/settled amount
      if (recipientStats) {
        recipientStats.totalShareCentavos += s.amountCentavos;
      }
    }

    const balances = Array.from(memberStatsMap.values()).map((entry) => {
      const netCentavos = entry.totalPaidCentavos - entry.totalShareCentavos;
      return {
        userId: entry.user.id,
        name: entry.user.name,
        email: entry.user.email,
        avatarUrl: entry.user.avatarUrl,
        gcashNumber: entry.user.gcashNumber,
        mayaNumber: entry.user.mayaNumber,
        totalPaidPesos: centavosToPesos(entry.totalPaidCentavos),
        totalPaidFormatted: formatPHP(entry.totalPaidCentavos, true),
        totalSharePesos: centavosToPesos(entry.totalShareCentavos),
        totalShareFormatted: formatPHP(entry.totalShareCentavos, true),
        netBalanceCentavos: netCentavos,
        netBalancePesos: centavosToPesos(netCentavos),
        netBalanceFormatted: formatPHP(netCentavos, true),
        status:
          netCentavos > 0
            ? ("CREDITOR" as const)
            : netCentavos < 0
              ? ("DEBTOR" as const)
              : ("SETTLED" as const),
      };
    });

    // Invariant check: sum(netBalanceCentavos) === 0
    const netSum = balances.reduce((acc, b) => acc + b.netBalanceCentavos, 0);
    if (netSum !== 0) {
      throw new Error(
        `Ledger net balance conservation invariant violated: sum(${netSum}) !== 0`,
      );
    }

    return balances;
  }

  /**
   * Greedy Debt Simplification Graph Solver:
   * Collapses N x N bilateral debts into at most N - 1 direct settlements.
   */
  async simplifyDebts(tripId: string, currentUserId: string) {
    const balances = await this.getTripBalances(tripId, currentUserId);

    const transfers = solveGreedyDebtGraph(
      balances.map((b) => ({
        userId: b.userId,
        name: b.name,
        avatarUrl: b.avatarUrl,
        gcashNumber: b.gcashNumber,
        mayaNumber: b.mayaNumber,
        netBalanceCentavos: b.netBalanceCentavos,
      })),
    );

    const simplifiedTransactions: SimplifiedDebtTransaction[] = transfers.map(
      (t) => {
        const mobile = t.toUserGcashNumber || t.toUserMayaNumber || null;
        return {
          fromUser: {
            id: t.fromUserId,
            name: t.fromUserName,
            avatarUrl: t.fromUserAvatarUrl || null,
          },
          toUser: {
            id: t.toUserId,
            name: t.toUserName,
            avatarUrl: t.toUserAvatarUrl || null,
            gcashNumber: t.toUserGcashNumber || null,
            mayaNumber: t.toUserMayaNumber || null,
          },
          amountCentavos: t.amountCentavos,
          amountPesos: t.amountPesos,
          formattedAmount: formatPHP(t.amountCentavos, true),
          suggestedPaymentMethod: t.suggestedPaymentMethod,
          qrPayload: {
            recipientName: t.toUserName,
            recipientMobile: mobile,
            amount: t.amountPesos,
          },
        };
      },
    );

    return {
      tripId,
      totalTransactions: simplifiedTransactions.length,
      transactions: simplifiedTransactions,
    };
  }

  /**
   * Settles a debt between two members and logs the settlement transaction
   */
  async settleDebt(tripId: string, currentUserId: string, dto: SettleDebtDto) {
    const { members } = await this.getVerifiedTripMembers(
      tripId,
      currentUserId,
    );

    const isFromMember = members.some((m) => m.userId === dto.fromUserId);
    const isToMember = members.some((m) => m.userId === dto.toUserId);

    if (!isFromMember || !isToMember) {
      throw new BadRequestError(
        "Both parties in the settlement must be members of the trip.",
      );
    }

    const amountCentavos = pesosToCentavos(dto.amount);

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.settlement.create({
        data: {
          tripId,
          payerId: dto.fromUserId,
          recipientId: dto.toUserId,
          amount: dto.amount,
          amountCentavos,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
        },
        include: {
          payer: { select: { id: true, name: true, avatarUrl: true } },
          recipient: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              gcashNumber: true,
              mayaNumber: true,
            },
          },
        },
      });

      return created;
    });

    return {
      id: settlement.id,
      tripId: settlement.tripId,
      fromUser: settlement.payer,
      toUser: settlement.recipient,
      amount: Number(settlement.amount),
      amountCentavos: settlement.amountCentavos,
      formattedAmount: formatPHP(settlement.amountCentavos, true),
      paymentMethod: settlement.paymentMethod,
      notes: settlement.notes,
      settledAt: settlement.settledAt,
    };
  }
}

export const ledgerService = new LedgerService();
