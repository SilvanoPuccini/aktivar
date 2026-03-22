# Design System Strategy: The Editorial Wild

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Pathfinder"**

This design system moves away from the sterile, modular grids of standard SaaS products to embrace the energy of a premium outdoor editorial. We are not just building a social app; we are crafting a digital field guide for Latin America’s most active communities. 

The "Modern Pathfinder" aesthetic is characterized by **intentional asymmetry**, where large-scale typography breaks the container, and **tonal depth**, where surfaces feel like layers of earth and moss rather than flat pixels. By blending the high-end polish of luxury travel magazines with the raw, data-driven energy of athletic performance, we create a signature experience that feels both authoritative and visceral.

## 2. Colors & Surface Philosophy
The palette is rooted in the "Deep Forest" spectrum, using an ultra-dark green-black base to allow our "Golden Hour" amber and "Highland" greens to vibrate with energy.

### The "No-Line" Rule
To maintain a high-end, organic feel, **explicitly prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
*   *Implementation:* Instead of a line between a header and a list, use a transition from `surface-container-low` to `surface`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use Material-inspired tiers to create natural depth without the clutter of shadows:
- **Base Layer:** `surface` (#11140f) - The ground beneath the feet.
- **Sectional Layer:** `surface-container-low` (#191c17) - Large structural blocks.
- **Interactive Layer:** `surface-container` (#1d201b) - The primary "card" surface.
- **Emphasis Layer:** `surface-container-highest` (#333630) - Inset elements or "pop" moments.

### The "Glass & Gradient" Rule
To inject "soul" into the dark theme, use **Glassmorphism** for floating elements (like bottom navigation or sticky headers). Use `surface` colors at 70% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** For primary CTAs, do not use flat fills. Use a subtle linear gradient from `primary` (#ffc56c) to `primary_container` (#f0a500) at a 135-degree angle to mimic the glow of a sunrise.

## 3. Typography: The Editorial Voice
Our typography is the primary driver of the brand's personality. We mix the heavy, humanistic weight of **Epilogue** with the technical precision of **Space Grotesk**.

- **Display & Headlines (Epilogue):** These are our "shout" moments. Use `display-lg` with `-2%` letter spacing and `bold` weights. Don't be afraid to let a headline bleed off a margin or overlap a photo.
- **Body (Plus Jakarta Sans):** Our "navigator." It provides high legibility for activity descriptions and community chats. Use `body-lg` for primary content to maintain a premium, spacious feel.
- **Labels & Data (Space Grotesk):** Our "instrumentation." Used for distances, altitudes, timestamps, and coordinates. This monospace-leaning font provides the technical "Strava-like" energy required for performance tracking.

## 4. Elevation & Depth
We achieve hierarchy through **Tonal Layering** rather than traditional structural lines.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural "lift" that feels integrated into the environment.
- **Ambient Shadows:** Shadows are a last resort. If a floating action button (FAB) or modal requires a shadow, it must be ultra-diffused: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color should be a tinted version of the background, never a neutral grey.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use the `outline_variant` token at **15% opacity**. 100% opaque borders are strictly forbidden.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text. High-contrast, rounded-full (pill shape).
- **Secondary:** `surface_container_high` background with `primary` text. No border.
- **Tertiary:** Ghost style. No background, `primary` text, bold weight.

### Chips (The Activity Pill)
Pill-shaped (999px radius). For category filters (e.g., "Hiking," "MTB"), use `surface-container-highest` for unselected and a full `secondary` (#7bda96) fill for active states to signify "Go" or "Confirmed."

### Cards & Lists
**Forbid the use of divider lines.**
- Separate activity feed items using `2.75rem` (spacing scale 8) of vertical whitespace. 
- Group related metadata (distance, time, difficulty) using a `surface-variant` background "pod" within the card.

### Input Fields
- **Background:** `surface-container-highest`.
- **Radius:** `md` (0.75rem).
- **Interaction:** On focus, the border shifts to a 1px "Ghost Border" of `primary` at 40% opacity.

### Navigation (The Trail Map)
The bottom navigation should use the **Glassmorphism** rule. A blurred `surface` background allows the colors of the activity feed to bleed through as the user scrolls, maintaining a sense of place.

## 6. Do's and Don'ts

### Do:
- **Use Large Imagery:** Treat photos of the Latin American landscape as the "background" whenever possible, using a `surface` gradient overlay (bottom-to-top) for text legibility.
- **Embrace Asymmetry:** Align headings to the left with a large margin, while placing data points (Space Grotesk) to the far right.
- **Use "Golden" Accents:** Save the `#F0A500` amber for the most critical actions: "Join Group," "Start Activity," or "Premium Upgrade."

### Don't:
- **Don't use pure white:** All "white" text must be `warm cream` (#EDE9DF) to prevent eye strain in dark mode and maintain the earthy tone.
- **Don't use 1px dividers:** If you feel the need for a line, increase your whitespace (e.g., move from `spacing-4` to `spacing-6`) instead.
- **Don't use standard shadows:** If it looks like a default Material Design shadow, it is too heavy. Lighten it until it is barely felt.