# EMI Loan Planner

An interactive personal finance utility and loan amortization planner. It calculates Equated Monthly Installments (EMI), models standard and custom prepayments (monthly, annual, and one-time), projects interest and tenure savings, and draws canvas-based visuals.

---

## Amortization Mathematics & Prepayments

The calculator runs dual simulations (a baseline without prepayments vs. an active plan with prepayments) to evaluate savings.

### 1. Equated Monthly Installment (EMI)
Calculated using the standard compounding annuity formula:

$$EMI = P \times r \times \frac{(1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $P$: Loan principal amount.
- $r$: Monthly interest rate ($R_{\text{annual}} / 12 / 100$).
- $n$: Loan tenure in months ($\text{Years} \times 12$).

### 2. Month-by-Month Amortization Schedule
For each month $m = 1, 2, ...$:
- **Interest Portion**:
  $$Interest_m = Balance_{m-1} \times r$$
- **Principal Portion**:
  $$Principal\_Paid_m = \min(EMI - Interest_m, Balance_{m-1})$$
- **Extra Prepayment ($PP_m$)**: Any extra principal prepaid at month $m$.
- **Ending Balance**:
  $$Balance_m = Balance_{m-1} - Principal\_Paid_m - PP_m$$

The loop terminates when $Balance_m \le 0$ or when the max term is reached.

### 3. Savings Calculations
- **Interest Saved**:
  $$\text{Interest Saved} = \sum Interest_{\text{baseline}} - \sum Interest_{\text{active}}$$
- **Tenure Saved**:
  $$\text{Tenure Saved} = Tenure_{\text{baseline}} - Tenure_{\text{active}} \quad (\text{months})$$

---

## Prepayment Modes Supported

1. **Monthly Prepayment**: An extra fixed amount added to the principal repayment every month.
2. **Annual Prepayment**: An extra lump sum paid at the end of each year (every 12th month).
3. **One-Time Prepayment**: A single lump sum payment credited at a specific month/year.

---

## Standalone Execution

1. Clone or download this directory.
2. Open `index.html` in any modern web browser to launch.
3. No server or internet connection required.
