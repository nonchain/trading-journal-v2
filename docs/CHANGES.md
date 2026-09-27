# Change Log

Summary of the work done on the TradingView Trade Journal extension since the initial MVP.

> Last updated: 2026-09-27

---

## 1. Dashboard and trade entry refactor

- Language and theme menus moved into the dashboard navbar (`components/dashboard/navbar-preferences.tsx`).
- Trade creation/editing goes through a single `TradeFormDialog` (`components/trades/trade-form-dialog.tsx`), reused by the dashboard, popup, side panel and the TradingView content UI.
- Persian (`fa`) is the default locale across the app.
- The trade form no longer has status or exit fields: new trades are always created as **open**.
- Open trades can be closed from the trades table row actions with **Close at SL** or **Close at TP**. The exit price is taken from the trade's stop loss / take profit (`journalRepo.closeAtStopLoss`, `journalRepo.closeAtTakeProfit`).

## 2. Localization, dates and fonts

- All dates (tables, cards, detail sheet, date picker, charts) are formatted through `useLocale`, so Persian shows Jalali dates and Persian digits, and English shows Gregorian dates.
- Chart axes, tooltips and the calendar heatmap use the active locale and font.
- Bundled fonts: **Vazir** (Persian) and **Montserrat** (English) under `public/fonts/`. They are registered with the FontFace API (`lib/fonts.ts`) so they also work inside the content script's shadow root on TradingView.
- Font files are declared as web-accessible resources in `wxt.config.ts`.

## 3. Forex and Crypto markets

- The new-trade dialog has **Forex** and **Crypto** tabs. The market is also auto-detected from the symbol when the symbol field loses focus.
- **Lot size** starts at `0.001` (step `0.001`). **Leverage** starts at `1`, with maximums of 1:2000 (forex) and ×200 (crypto).
- Position maths live in `lib/markets.ts` (`computePosition`):
  - Forex contract size: 100,000 units (XAU 100, XAG 5,000). Pip size: 0.0001, 0.01 for JPY pairs, 0.1 for gold.
  - P&L is converted from the quote currency to the account currency. When the conversion can't be derived from the price, the form asks for a **quote rate**.
  - Crypto contract size is 1. An estimated liquidation price is shown.
  - Margin = notional / leverage. Risk, reward, R-multiple and ROE are also computed.
- A live position summary is shown in the form. The trade detail sheet and trades table show the market, lot size, leverage and margin.
- Validation messages are translated (`validation.*` keys rendered by `FormMessage`).
- Older trades without a market are treated as crypto.

## 4. Scrollbar styling

- Minimal, modern scrollbars for light and dark themes (WebKit and Firefox), defined with CSS variables in `assets/styles/globals.css`. The `ScrollArea` component uses the same colors.

## 5. Multiple accounts

- **First run:** the user must create an account before logging trades. Fields: name, initial balance, currency (USD, EUR, GBP, JPY, CHF, CAD, AUD, USDT, USDC), optional icon, and a color theme. A live preview is shown while filling the form.
- **Per-account trades:** every trade belongs to an account. Lists, stats and charts show only the active account's trades. Trades logged before accounts existed are adopted by the first account.
- **Switching:** an account switcher (avatar, name, balance) is available in the dashboard sidebar, popup and side panel. New accounts become active automatically.
- **Management:** Settings → Accounts lets the user switch, edit or delete accounts. Deleting an account also deletes its trades (the confirmation shows how many).
- **Balances:** current balance = initial balance + realized P&L. The overview has a Balance KPI with return %, and the equity curve starts from the initial balance and uses the account color.
- Amounts are formatted in the active account's currency (non-ISO codes such as USDT are shown as a prefix).
- Export/import include accounts. "Clear all data" also removes accounts.
- Main files: `lib/accounts.ts`, `lib/storage.ts`, `components/accounts/*`.

## 6. Bug fixes

- **Popup select opens and closes immediately:** the Chrome popup resized itself when a Radix Select or menu opened, and a resize closes the Select/menu. The popup now has a fixed 380×600 size (`entrypoints/popup/index.html`).
- **Account dialog not closing after creating an account:** the dialog now closes as soon as the account is saved. The change broadcast to the background script no longer blocks storage writes, and the account dropdown is non-modal to avoid focus conflicts with the dialog.
- **"Manage accounts" in the popup/side panel opened Overview instead of Settings:** the dashboard section is now kept in the URL hash (e.g. `options.html#settings`). `openDashboard(section)` in `lib/navigation.ts` opens the dashboard at that section and reuses an already open dashboard tab. Refreshing the dashboard also keeps the current section.
