import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { solveGreedyDebtGraph, type MemberNetBalanceInput } from "../ledger.js";

describe("Unit 17: Pure Greedy Debt Graph Solver (@gala-ph/shared)", () => {
  it("should simplify a 3-way circular debt into minimal bilateral transfers", () => {
    // User A paid for User B (₱100), User B paid for User C (₱100), User C paid for User A (₱100)
    // Net balances are all 0: sum = 0, so 0 transfers needed
    const members: MemberNetBalanceInput[] = [
      { userId: "u1", name: "User 1", netBalanceCentavos: 0 },
      { userId: "u2", name: "User 2", netBalanceCentavos: 0 },
      { userId: "u3", name: "User 3", netBalanceCentavos: 0 },
    ];

    const result = solveGreedyDebtGraph(members);
    assert.equal(result.length, 0);
  });

  it("should resolve unequal balances and satisfy conservation of centavos", () => {
    // User A paid ₱3,000 for dinner.
    // 3 users consumed ₱1,000 each.
    // Net: User A = +2000, User B = -1000, User C = -1000
    const members: MemberNetBalanceInput[] = [
      {
        userId: "uA",
        name: "Alice",
        gcashNumber: "+639171234567",
        netBalanceCentavos: 200000,
      },
      { userId: "uB", name: "Bob", netBalanceCentavos: -100000 },
      { userId: "uC", name: "Charlie", netBalanceCentavos: -100000 },
    ];

    const transfers = solveGreedyDebtGraph(members);
    assert.equal(transfers.length, 2);

    const totalTransferred = transfers.reduce(
      (acc, t) => acc + t.amountCentavos,
      0,
    );
    assert.equal(totalTransferred, 200000);

    assert.equal(transfers[0]?.toUserId, "uA");
    assert.equal(transfers[0]?.suggestedPaymentMethod, "GCASH");
    assert.equal(transfers[1]?.toUserId, "uA");
  });

  it("should throw an error if net balance conservation is violated", () => {
    const invalidMembers: MemberNetBalanceInput[] = [
      { userId: "uA", name: "Alice", netBalanceCentavos: 5000 },
      { userId: "uB", name: "Bob", netBalanceCentavos: -3000 }, // sum is 2000, not 0
    ];

    assert.throws(
      () => solveGreedyDebtGraph(invalidMembers),
      /Ledger net balance conservation invariant violated/,
    );
  });
});
