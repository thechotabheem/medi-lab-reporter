

## Plan: Fix right column spacing in PatientInfoBox

**Problem:** The right column has 3 items vs left's 4, causing extra whitespace at the bottom. The `justifyContent: 'center'` helps vertically center but doesn't reduce the box height. Also, spacing between right column items needs to be increased.

**Changes in `src/lib/pdf/components/PatientInfoBox.tsx`:**

1. Increase `marginBottom` on right column's `InfoPair` items from 5 to 8 by passing a custom spacing prop
2. Remove the outer container's fixed `padding: 12` approach — instead, make the container height driven by content by not stretching columns equally. Use `alignItems: 'stretch'` on the row but let columns size naturally.

Actually, the simpler approach: The box height is dictated by the taller left column (4 items). The right column (3 items) will always have extra space. The best fix is:

1. **Increase spacing between right column items** — increase `marginBottom` from 5 to 10 for right column items only (add an optional `spacing` prop to `InfoPair`)
2. **Keep `justifyContent: 'center'`** on the right column to distribute the remaining space evenly above/below

This will spread the 3 right-column items more evenly across the available height, eliminating the appearance of excess whitespace while increasing readability.

### Implementation

**`src/lib/pdf/components/PatientInfoBox.tsx`:**
- Add optional `spacing` prop to `InfoPair` component (default 5)
- Pass `spacing={10}` to the three right-column `InfoPair` instances
- Keep `justifyContent: 'center'` on the right column

