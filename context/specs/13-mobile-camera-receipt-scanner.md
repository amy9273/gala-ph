# Unit 13: Mobile Camera Receipt Scanner — GalaPH

This specification details the mobile camera capture workflow, OCR line-item parsing engine, touch-to-tag eater assigning UI, non-drinker exclusion filters, and offline SQLite integration for receipt digitization.

---

## 1. Scope & Deliverables

1. **Receipt OCR Text Parser Engine (`apps/mobile/src/services/receipt-ocr.service.ts`)**:
   - Heuristic line-item extraction regex tailored to Philippine restaurant receipts (Dampa, Beachside Grills, Paluto, Cafes):
     - Parses dish name, quantity multiplier (`2x`, `@`, `Qty`), and price in integer centavos.
     - Detects and extracts Subtotal, Service Charge (SC), Tax/VAT (12%), Discounts (Senior/PWD), and Grand Total.
     - Confidence score calculation per parsed item.
   - Sample Philippine receipt test fixtures:
     - **Tagpuan San Juan Seafood & Beers**: Garlic Butter Shrimp, Grilled Tuna Panga, San Mig Light Bucket, SC 10%, VAT.
     - **Kahuna Beachfront Brunch**: Avocado Toast, Baguio Brew Coffee, Fresh Mango Shake.
     - **Baler Surfside Grill**: Inihaw na Liempo, Sinigang na Hipon, San Mig Apple.

2. **Touch-to-Tag Eater Assigning UI (`apps/mobile/src/components/receipt/`)**:
   - `<ReceiptReviewModal />`: Full-screen bottom sheet for reviewing OCR extractions, editing item amounts, and tagging members.
   - `<LineItemAssigner />`:
     - Horizontal avatar chips for each member (`Miguel`, `Bea`, `Carlos`, `Denise`).
     - 1-tap toggles to assign/unassign eaters per dish.
     - Quick preset buttons:
       - **"All Members"**: Tags all trip members.
       - **"Drinkers Only"**: Automatically excludes `isNonDrinker` members from alcoholic line items.
       - **"Custom Select"**: Specific eaters.
   - `<ReceiptSplitPreview />`: Live recalculation of per-person centavo breakdown with proportional SC & Tax.

3. **Receipt Scanner & Camera Screen (`apps/mobile/src/screens/ReceiptScannerScreen.tsx`)**:
   - Camera Viewfinder overlay with receipt alignment grid, flash/torch toggle, and capture shutter button ($56\text{dp}$ touch target).
   - Mock gallery picker & photo loader for simulator and physical device testing.
   - Step 1: Camera Snap $\to$ Step 2: OCR Extraction $\to$ Step 3: Touch-to-Tag Review $\to$ Step 4: Save to Offline SQLite & Outbox Queue.

4. **Integration with Monorepo & Navigation**:
   - Added `scanner` tab / quick floating action dock in `BottomTabBar.tsx` and `App.tsx`.
   - Direct persistence into `local_expenses`, `local_expense_items`, `local_expense_splits` via `expenseRepository` and `outboxSyncService`.

5. **Quality Gates**:
   - 100% Prettier formatting compliance.
   - 0 TypeScript errors across all workspaces (`npm run typecheck --workspaces`).
   - 0 ESLint warnings (`npm run lint`).
   - Clean Next.js static build (`npm run build:web`).
   - Full automated test suite pass (`npm test`).
