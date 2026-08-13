# Waitly Mobile

React Native + Expo app for restaurant staff:

- waiter table flow
- manager dashboard
- owner/manager inventory view
- kitchen display system (KDS) for chefs and cooks

## Setup

```bash
npm install
npm start
```

Run on a device:

```bash
npm run android
npm run ios
npm run web
```

Production preview: https://waitly-final-live.vercel.app

## Production API

The app points to:

```text
https://api.moonlauncher.org/api/v1
```

Main API client:

```text
src/api/client.js
```

Legacy screens still using the old client should use:

```text
services/api.js
```

Both clients refresh JWT tokens and clear local auth on 403.

See `MOBILE_APP_GUIDE.md` for complete documentation.

## Guest Telegram Web App

The web build opens the guest-facing Waitly experience: restaurant discovery, table reservations, QR table context, kitchen ETA, table menu, orders, profile, RU/UZ/EN switching, and a Payme tokenization demo.

```bash
npm run web
```

Table deep links are supported with `?table=14`, `?startapp=table_14`, `#table_14`, or Telegram `initDataUnsafe.start_param`. Payme is intentionally represented by a secure iFrame integration boundary until merchant API credentials are available; the demo stores only a masked card reference and never accepts raw card details.

The backend catalog can be populated idempotently with:

```bash
docker compose exec web python manage.py seed_guest_demo
```

Telegram registration uses signed `initData` plus the guest phone number. A user becomes `Verified member` only after an active Payme token exists. Register the bot webhook only after setting rotated secrets in the backend environment:

```bash
docker compose exec web python manage.py set_telegram_webhook
```

## Roles

- `WAITER`: waiter dashboard, tables, order creation
- `CHEF` / `COOK`: kitchen display system
- `MANAGER` / legacy `HEAD_WAITER`: manager dashboard, staff, inventory
- `RESTAURANT_OWNER`: owner dashboard, tables, staff, inventory

## KDS Flow

The kitchen board follows the backend state machine:

```text
CREATED -> ACCEPTED -> COOKING -> READY
```

Actions:

- `Claim`: calls `/core/orders/:id/accept/`
- `Start cooking`: calls `/core/orders/:id/cooking/`
- `Ready`: calls `/core/orders/:id/ready/`

The board auto-refreshes every 10 seconds, vibrates on new orders, highlights late orders, and uses a two/three-column tablet grid for Galaxy Tab A9/A9+.

## Quick QA

1. Login as `CHEF` or `COOK`.
2. Create a waiter or guest order.
3. Confirm it appears on KDS within 10 seconds.
4. Tap `Claim`, then `Start cooking`, then `Ready`.
5. Confirm the owner/waiter panels see the status updates.
6. Rotate an 8.7" or 11" tablet and confirm cards stay readable.
