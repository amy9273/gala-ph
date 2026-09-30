export interface MemberNetBalanceInput {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  gcashNumber?: string | null;
  mayaNumber?: string | null;
  netBalanceCentavos: number;
}

export interface SimplifiedDebtTransfer {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl?: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatarUrl?: string | null;
  toUserGcashNumber?: string | null;
  toUserMayaNumber?: string | null;
  amountCentavos: number;
  amountPesos: number;
  suggestedPaymentMethod: "GCASH" | "MAYA" | "CASH";
}

/**
 * Pure Greedy Debt Simplification Graph Solver:
 * Collapses N x N bilateral debts into at most N - 1 direct settlements
 * using exact integer centavos with zero remainder loss.
 *
 * Invariant: Sum of net balances must equal 0.
 */
export function solveGreedyDebtGraph(
  members: MemberNetBalanceInput[],
): SimplifiedDebtTransfer[] {
  const netSum = members.reduce((acc, m) => acc + m.netBalanceCentavos, 0);
  if (netSum !== 0) {
    throw new Error(
      `Ledger net balance conservation invariant violated: sum(${netSum}) !== 0`,
    );
  }

  interface Debtor {
    userId: string;
    name: string;
    avatarUrl?: string | null;
    remainingDebtCentavos: number;
  }

  interface Creditor {
    userId: string;
    name: string;
    avatarUrl?: string | null;
    gcashNumber?: string | null;
    mayaNumber?: string | null;
    remainingCreditCentavos: number;
  }

  const debtors: Debtor[] = [];
  const creditors: Creditor[] = [];

  for (const m of members) {
    if (m.netBalanceCentavos < 0) {
      debtors.push({
        userId: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl,
        remainingDebtCentavos: -m.netBalanceCentavos,
      });
    } else if (m.netBalanceCentavos > 0) {
      creditors.push({
        userId: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl,
        gcashNumber: m.gcashNumber,
        mayaNumber: m.mayaNumber,
        remainingCreditCentavos: m.netBalanceCentavos,
      });
    }
  }

  // Sort descending by remaining balance to maximize greedy bilateral cancellation
  debtors.sort((a, b) => b.remainingDebtCentavos - a.remainingDebtCentavos);
  creditors.sort(
    (a, b) => b.remainingCreditCentavos - a.remainingCreditCentavos,
  );

  const transfers: SimplifiedDebtTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]!;
    const creditor = creditors[cIdx]!;

    const transferCentavos = Math.min(
      debtor.remainingDebtCentavos,
      creditor.remainingCreditCentavos,
    );

    if (transferCentavos > 0) {
      const suggestedMethod: "GCASH" | "MAYA" | "CASH" = creditor.gcashNumber
        ? "GCASH"
        : creditor.mayaNumber
          ? "MAYA"
          : "CASH";

      transfers.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.name,
        fromUserAvatarUrl: debtor.avatarUrl,
        toUserId: creditor.userId,
        toUserName: creditor.name,
        toUserAvatarUrl: creditor.avatarUrl,
        toUserGcashNumber: creditor.gcashNumber,
        toUserMayaNumber: creditor.mayaNumber,
        amountCentavos: transferCentavos,
        amountPesos: transferCentavos / 100,
        suggestedPaymentMethod: suggestedMethod,
      });
    }

    debtor.remainingDebtCentavos -= transferCentavos;
    creditor.remainingCreditCentavos -= transferCentavos;

    if (debtor.remainingDebtCentavos === 0) dIdx++;
    if (creditor.remainingCreditCentavos === 0) cIdx++;
  }

  return transfers;
}
