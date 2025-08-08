# Assets Feature Prompt

## Overview

Create an "assets" feature that applies to products, categories, and plans. This feature should provide a reusable modal for asset selection and management.

## Requirements

- The assets section must be implemented as a reusable modal.
- By default, the modal displays the current assets.
- Users must be able to add a new asset.
- If an asset is selected, it can be deleted.
- If no assets exist, users should have the option to add one.
- The modal must function as a field for react-hook-form.
- When adding a product, a field for adding images should be present. Clicking it opens the asset gallery in selection mode.

## Component Design

### AssetSelector
- Component name: `<AssetSelector />`
- Props:
  - `name`: The form field name.
  - `multi`: Boolean flag for multiple selection.
- Value shape:
  - If `multi` is true:
    ```js
    {
      assets: ["assetId1", "assetId2"]
    }
    ```
  - If `multi` is false:
    ```js
    {
      asset: "assetId"
    }
    ```

### Asset Fetching and Preview
- When asset IDs are present in the form, fetch asset data using TanStack Query (react-query).
- Display assets in a carousel using `react-native-reanimated-carousel` (install with `expo install react-native-reanimated-carousel`).
- If only one asset is present, render the image or video directly (no carousel).
- Use an `<AssetPreview />` component to render assets appropriately (image or video).

## Modal Behavior
- The asset list is global.
- By default, selected assets appear first in the modal.
- The modal allows selecting one or multiple assets, depending on the `isMulti` flag.

## Example Usage

```jsx
<AssetSelector name="productImages" multi={true} />
```

---

This prompt is designed to be LLM-friendly and clear for implementation.
