import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  StyleSheet,
} from "react-native";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { Ionicons } from "@expo/vector-icons";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { outboxSyncService } from "../services/outbox-sync.service";
import type { LocalExpense } from "../types";
import type { ExpenseCategory } from "@gala-ph/shared";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "FOOD_AND_DINING",
  "ALCOHOL_AND_BAR",
  "TOLL_HIGHWAY",
  "FUEL_AND_GAS",
  "COMMUTE_TICKET",
  "LODGING_RESORT",
  "LOCAL_TOUR_GUIDE",
  "ENVIRONMENTAL_FEE",
  "SHARED_GROCERY",
  "MISCELLANEOUS",
];

export const ExpensesScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_AND_DINING");
  const [amountPesos, setAmountPesos] = useState("");
  const [paidByName, setPaidByName] = useState("Miguel Santos");
  const [excludeNonDrinkers, setExcludeNonDrinkers] = useState(false);

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await expenseRepository.getByTripId("trip-elyu-demo");
      setExpenses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load local expenses",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!title.trim() || !amountPesos.trim()) return;

    const totalCentavos = Math.round(parseFloat(amountPesos || "0") * 100);
    if (totalCentavos <= 0) return;

    const expenseId = `exp-local-${Date.now()}`;

    // Auto calculate demo splits (4 members: Miguel, Bea, Carlos, Denise)
    // If excludeNonDrinkers is true, Bea is excluded (3 consumers)
    const consumers = excludeNonDrinkers
      ? [
          { id: "user-miguel", name: "Miguel Santos" },
          { id: "user-carlos", name: "Carlos Mendoza" },
          { id: "user-denise", name: "Denise Laurel" },
        ]
      : [
          { id: "user-miguel", name: "Miguel Santos" },
          { id: "user-bea", name: "Bea Alonzo" },
          { id: "user-carlos", name: "Carlos Mendoza" },
          { id: "user-denise", name: "Denise Laurel" },
        ];

    const perPersonCentavos = Math.round(totalCentavos / consumers.length);

    const newExpense: LocalExpense = {
      id: expenseId,
      tripId: "trip-elyu-demo",
      paidById: "user-miguel",
      paidByName,
      title: title.trim(),
      category,
      totalCentavos,
      serviceTaxCentavos: 0,
      isSynced: false,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: `item-${Date.now()}`,
          expenseId,
          name: title.trim(),
          priceCentavos: totalCentavos,
          quantity: 1,
          consumerIds: consumers.map((c) => c.id),
        },
      ],
      splits: consumers.map((c, idx) => ({
        id: `split-${expenseId}-${idx}`,
        expenseId,
        userId: c.id,
        userName: c.name,
        amountCentavos: perPersonCentavos,
        isSettled: c.name === paidByName,
      })),
    };

    const saved = await outboxSyncService.addExpenseOptimistic(newExpense);
    setExpenses((prev) => [saved, ...prev]);
    setIsModalOpen(false);

    // Reset
    setTitle("");
    setAmountPesos("");
    setExcludeNonDrinkers(false);
  };

  const totalSpentCentavos = expenses.reduce(
    (sum, e) => sum + e.totalCentavos,
    0,
  );

  return (
    <View style={styles.container}>
      {/* Header & Total Spend */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>KKB Ledger</Text>
          <Text style={styles.headerSubtitle}>
            {expenses.length} offline expenses logged
          </Text>
        </View>
        <Button
          title="+ Log Expense"
          onPress={() => setIsModalOpen(true)}
          variant="danger"
          style={styles.addButton}
        />
      </View>

      {/* Spend Summary Bento */}
      <View style={styles.summaryContainer}>
        <Card variant="oceanGlow" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Group Spend</Text>
          <CurrencyDisplay
            centavos={totalSpentCentavos}
            size="xl"
            color={AppColors.accentSunset}
          />
          <Text style={styles.summarySub}>
            Split equally with non-drinker protection & exact centavo math
          </Text>
        </Card>
      </View>

      {/* 4-State UI Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <ErrorState message={error} onRetry={loadExpenses} />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.content}>
          <EmptyState
            title="No Expenses Logged"
            description="Log meal bills, gas stops, resort fees, and tollways offline. Splits are calculated automatically."
            actionTitle="+ Log First Expense"
            onAction={() => setIsModalOpen(true)}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {expenses.map((expense) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.categoryBadge}>
                  <Badge
                    label={expense.category.replace(/_/g, " ")}
                    variant={
                      expense.category === "TOLL_HIGHWAY"
                        ? "autosweep"
                        : expense.category === "ALCOHOL_AND_BAR"
                          ? "unsettled"
                          : "ocean"
                    }
                  />
                  {!expense.isSynced ? (
                    <Badge
                      label="Queued"
                      variant="offline"
                      style={{ marginLeft: 6 }}
                    />
                  ) : null}
                </View>

                <CurrencyDisplay
                  centavos={expense.totalCentavos}
                  size="md"
                  color={AppColors.textPrimary}
                />
              </View>

              <Text style={styles.expenseTitle}>{expense.title}</Text>
              <Text style={styles.paidByText}>
                Paid by{" "}
                <Text style={styles.payerHighlight}>{expense.paidByName}</Text>
              </Text>

              {/* Splits List */}
              <View style={styles.splitsList}>
                {expense.splits.map((split) => (
                  <View key={split.id} style={styles.splitRow}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={13}
                        color={AppColors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.splitUser}>{split.userName}</Text>
                    </View>
                    <View style={styles.splitAmountRow}>
                      <CurrencyDisplay
                        centavos={split.amountCentavos}
                        size="sm"
                        color={
                          split.isSettled
                            ? AppColors.natureEmerald
                            : AppColors.unsettled
                        }
                      />
                      <Badge
                        label={split.isSettled ? "Paid" : "Owed"}
                        variant={split.isSettled ? "settled" : "unsettled"}
                        style={styles.splitBadge}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Log Expense</Text>

            <Text style={styles.inputLabel}>Title / Description</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Seafood Dinner at Tagpuan, Gas refill"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catPickerRow}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catPickerOption,
                    category === cat && styles.catPickerOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catPickerText,
                      category === cat && styles.catPickerTextActive,
                    ]}
                  >
                    {cat.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Total Amount (₱)</Text>
            <TextInput
              style={styles.input}
              value={amountPesos}
              onChangeText={setAmountPesos}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Paid By</Text>
            <TextInput
              style={styles.input}
              value={paidByName}
              onChangeText={setPaidByName}
              placeholderTextColor={AppColors.textMuted}
            />

            {/* Non-drinker exclusion toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Exclude Non-Drinkers</Text>
                <Text style={styles.toggleSubtitle}>
                  Exempts non-drinkers from alcohol split portions
                </Text>
              </View>
              <Switch
                value={excludeNonDrinkers}
                onValueChange={setExcludeNonDrinkers}
                trackColor={{
                  false: AppColors.darkBorder,
                  true: AppColors.natureEmerald,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsModalOpen(false)}
                variant="outline"
                style={{ flex: 1, marginRight: AppSpacing.sm }}
              />
              <Button
                title="Save Offline"
                onPress={handleAddExpense}
                variant="danger"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: AppSpacing.base,
    paddingTop: AppSpacing.base,
    paddingBottom: AppSpacing.xs,
  },
  headerTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  addButton: {
    minHeight: 38,
    paddingHorizontal: AppSpacing.md,
  },
  summaryContainer: {
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.sm,
  },
  summaryCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: AppSpacing.base,
  },
  summaryLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summarySub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: AppSpacing.base,
  },
  expenseCard: {
    marginBottom: AppSpacing.md,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.xs,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  paidByText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: AppSpacing.sm,
  },
  payerHighlight: {
    color: AppColors.brandOceanLight,
    fontWeight: "700",
  },
  splitsList: {
    borderTopWidth: 1,
    borderTopColor: AppColors.darkBorder,
    paddingTop: AppSpacing.sm,
    gap: 6,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  splitUser: {
    ...AppTypography.caption,
    color: AppColors.textPrimary,
  },
  splitAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitBadge: {
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: AppSpacing.base,
  },
  modalContent: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.cardBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    padding: AppSpacing.xl,
    maxHeight: "85%",
  },
  modalTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
    marginBottom: AppSpacing.base,
  },
  inputLabel: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderColor: AppColors.darkBorder,
    borderWidth: 1,
    borderRadius: AppSpacing.buttonBorderRadius,
    color: AppColors.textPrimary,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    marginBottom: AppSpacing.md,
    fontSize: 14,
  },
  catPickerRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: AppSpacing.md,
  },
  catPickerOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  catPickerOptionActive: {
    backgroundColor: AppColors.brandOcean,
    borderColor: AppColors.brandOceanLight,
  },
  catPickerText: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
  catPickerTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  toggleTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
  },
  toggleSubtitle: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: AppSpacing.sm,
  },
});
