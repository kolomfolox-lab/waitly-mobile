# KDS Revival Roadmap

## Current Scope

- Align mobile API endpoints with the current Django backend.
- Replace the stale chef stop-list mock with a real KDS order board.
- Optimize the KDS layout for Samsung Galaxy Tab A9 8.7" and A9+ 11".
- Support `CREATED -> ACCEPTED -> COOKING -> READY` with visible kitchen actions.
- Add vibration and visual alerts for newly created orders.
- Highlight cancelled and late orders so the kitchen avoids waste.

## Done In This Update

- Production API URL uses `https://api.moonlauncher.org/api/v1`.
- KDS uses live `/core/orders/` data and backend transition endpoints.
- Chef/cook UI uses large cards, high-contrast dark mode, and tablet columns.
- Inventory screen uses the shared JWT client and no longer depends on a missing `authService`.
- Manager navigation supports both `MANAGER` and legacy `HEAD_WAITER`.

## Next

- Add real audio chimes with `expo-av` and bundled sound assets.
- Add WebSocket updates to reduce polling delay.
- Add cancellation-loss rules after Click/Payme refund rules are finalized.
- Add EAS tablet preview builds for Galaxy Tab A9 QA.
