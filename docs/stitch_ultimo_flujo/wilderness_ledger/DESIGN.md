# Design System Strategy: The Digital Alpinist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Expedition."** We are moving away from the "app-like" fatigue of rounded squares and generic grids toward a high-end, editorial experience. Think of this as a premium adventure journal—where the ruggedness of the outdoors meets the precision of a Swiss timepiece.

To break the "template" look, we utilize **Intentional Asymmetry**. We do not center everything. We use oversized typography that "bleeds" off containers, overlapping images that break the grid, and a sophisticated hierarchy that prioritizes the "story" of the outdoor activity over the "data."

## 2. Colors & Surface Architecture
Our palette is rooted in the "Golden Hour" of the forest. It’s dark, warm, and high-contrast, ensuring that every interaction feels like a premium invitation to explore.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or layouts. In this system, boundaries are created through **Tonal Shifting**. A `surface-container-low` section sitting on a `surface` background provides all the definition needed. If a line feels necessary, your spacing is likely too tight.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers—stacked sheets of heavy, matte paper.
- **Base Layer:** `surface` (#11140f) for the primary app background.
- **Mid-Tier:** `surface-container` (#1d201b) for content blocks and feed items.
- **High-Tier:** `surface-container-highest` (#333630) for interactive elements like inputs or modals.
*Nesting Principle:* Use a lower tier for the container and a higher tier for the interactive element inside it to create a natural, "physical" lift.

### The "Glass & Gradient" Rule
To add "soul" to our flat aesthetic, use **Glassmorphism** for floating headers or navigation bars. Use the `surface` color at 70% opacity with a `24px` backdrop-blur. 
*Signature Polish:* While the user requested no gradients, we apply a "Micro-Gradient" to primary CTAs—a subtle shift from `primary` (#ffc56c) to `primary-container` (#f0a500)—to prevent the buttons from looking like flat clip-art.

## 3. Typography
Our type scale is built to scream "Editorial Authority."

- **Display & Headlines (Epilogue):** Heavy weights, tight letter spacing (-0.04em), and aggressive sizing. These are your "Magazine Headlines." Use `display-lg` for hero stats and `headline-md` for section titles.
- **Body (Manrope):** A high-legibility sans-serif. We use `body-lg` (1rem) as our standard to maintain a premium, spacious feel. Never crowd the text.
- **Accents (Space Grotesk):** This is our "Technical Layer." All distances (km), timestamps (12:40), and GPS coordinates must use this monospace font. It provides the "Strava Energy"—the feeling of data being tracked by a high-end instrument.

## 4. Elevation & Depth
We reject the standard Material Design drop shadow. We achieve depth through **Ambient Luminescence.**

- **The Layering Principle:** Depth is achieved by stacking `surface-container` tiers. A `surface-container-lowest` card placed on a `surface-container-low` section creates a "soft pocket" effect.
- **Ambient Shadows:** For floating modals, use a "Forest Shadow": `0px 24px 48px rgba(12, 15, 10, 0.4)`. The shadow is a dark green-tinted neutral, never pure black, ensuring it feels like a natural shadow cast in the woods.
- **The Ghost Border:** If accessibility requires a border (e.g., in high-glare outdoor settings), use a "Ghost Border": the `outline-variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons & Chips
- **Primary Button:** Large (min-height 56px), `primary` color, `1.5rem` (xl) corner radius. Use `label-md` uppercase for the text.
- **Pill Chips:** These are our "Category Anchors." Always pill-shaped (`9999px` radius). For unselected states, use `surface-container-high` with `on-surface-variant` text.
- **Interaction:** Hover states should involve a subtle scale-up (1.02x) rather than just a color change, mimicking the physical "press" of a tactile button.

### Cards & Lists
- **The Divider Ban:** Never use a horizontal line to separate list items. Use `2rem` (6) or `2.75rem` (8) of vertical whitespace.
- **Asymmetric Cards:** For featured outdoor activities, use a card where the image has a `1rem` radius but the container has a `0.5rem` radius, creating a "nested offset" look.

### Input Fields
- **Editorial Inputs:** No boxes. Use a `surface-container-highest` background with a bottom-heavy padding. The label should always be in `label-sm` (Space Grotesk) to maintain the "Technical" aesthetic.

### Additional Signature Components
- **The "Trail Progress" Bar:** A custom progress indicator for hikes or runs. Use a thick `secondary-container` track with a high-contrast `secondary` (forest green) fill.
- **The Adventure Stats Grid:** A 2x2 or 3x1 grid using `display-sm` numbers paired with `label-sm` technical descriptions.

## 6. Do’s and Don’ts

### Do:
- **Use "Mega-Margins":** If the system says `1.4rem`, try `2.75rem`. Whitespace is the ultimate luxury.
- **Mix the Fonts:** Always pair a `display` heading with a `label` (Monospace) sub-header for that "Adventure Map" look.
- **Bleed Images:** Let images of mountains or trails touch the edge of the screen to create an immersive feeling.

### Don’t:
- **Don't use 100% white:** Only use `body-text` (#EDE9DF). Pure white (#FFFFFF) will break the dark, warm "campfire" atmosphere.
- **Don't use standard icons:** Use "Thin" or "Light" stroke icons (1.5px weight) to match the elegance of the typography. Heavy icons will look too "utility."
- **Don't center everything:** Aligned-left is the editorial standard. Use it religiously.