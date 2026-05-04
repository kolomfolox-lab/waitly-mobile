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
