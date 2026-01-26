# Finance Page - User Guide

## Overview
The Finance page (`/finance`) provides comprehensive expense tracking with support for time-based filtering, CSV import, and automatic integration with the shopping scanner.

## Features

### 1. Time Period Filtering
View your expenses by:
- **Hoy** (Today): Expenses from today only
- **Semana** (Week): Last 7 days
- **Mes** (Month): Current month (default view)
- **Todo** (All): All expenses ever recorded

### 2. Summary Statistics
At the top of the page, you'll see:
- **Total gastado**: Total amount spent in the selected period
- **Número de gastos**: Count of expenses
- **Promedio**: Average expense amount
- **Por categoría**: Breakdown showing total and count per category

### 3. Expense List
Expenses are grouped by date with:
- Spanish-localized date headers (Hoy, Ayer, or full date)
- Amount, description, and category
- For receipts: expandable line items view (click the arrow icon)
- Delete button for each expense

### 4. Receipt Line Items (Lineas de Compra)
When an expense has line items (from a scanned receipt):
- An arrow icon appears next to the expense
- Click to expand and see all items purchased
- Each line shows: name, quantity (if >1), and price
- Total is shown at the expense level

### 5. CSV Import
Import historical expenses:
1. Click the file input to select a CSV file
2. Format: `date,amount,description,category`
3. Example:
   ```csv
   2024-01-15,23.45,Compra en Mercadona,Groceries
   2024-01-16,45.00,Gasolina,Transport
   ```
4. Click "Importar"
5. System will:
   - Detect and skip duplicates
   - Show count of imported and skipped expenses
   - Refresh the expense list automatically

### 6. Scanner Integration
When you scan a receipt in the Shopping page:
1. AI extracts store, date, total, and items
2. Items are added to shopping list (or marked as bought if already there)
3. An expense is automatically created in Finance with:
   - Total amount
   - Description: "Compra en [Store Name]"
   - Category: "Groceries"
   - Date from receipt
   - All line items stored
4. The finance page is automatically refreshed

## Database Migration

Before using the finance page, run the migration:

```bash
# Connect to your Turso database
turso db shell [your-db-name]

# Run the migration
.read lib/db/migrations/003_expense_items.sql
```

Or manually execute:
```sql
CREATE TABLE IF NOT EXISTS expense_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expense_items_expense ON expense_items(expense_id);
```

## Mobile Experience
The page is optimized for mobile:
- Responsive summary cards (stack on mobile)
- Touch-friendly buttons and expandable items
- Horizontal scroll for time period filters if needed
- Compact expense cards with clear hierarchy

## Tips
1. **Delete expenses carefully**: There's no undo
2. **CSV format**: Ensure dates are YYYY-MM-DD format
3. **Duplicates**: System checks date + amount + description
4. **Line items**: Only visible for expenses created from scanned receipts
5. **Scope**: Personal expenses (org_id = NULL) or household expenses (org_id set)

## Troubleshooting

**Q: I scanned a receipt but don't see it in finance**
A: Check that:
- Scanner completed successfully
- You're viewing the right time period (try "Todo")
- You're in the right scope (Personal vs Household)

**Q: CSV import shows all items as skipped**
A: Likely duplicates exist. Check:
- Same date, amount, and description
- Try different data

**Q: Line items don't show**
A: Line items only appear for:
- Expenses created from scanned receipts
- Not for manually created expenses or CSV imports
