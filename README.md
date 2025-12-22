# Identity Verification Application

A React + TypeScript + Vite application for identity verification using OCR and face recognition.

## Features

- ✅ **ID Card OCR**: Extract name, surname, and TC No from Turkish ID card MRZ section
- ✅ **Face Recognition**: Extract and compare faces from ID card and selfie
- ✅ **Liveness Detection**: Blink detection to verify user is alive using MediaPipe
- ✅ **Face Matching**: Compare ID portrait with selfie using face-api.js
- ✅ **Error Handling**: Error Boundary for graceful error handling
- ✅ **Code Splitting**: Lazy loading for optimized bundle size
- ✅ **Accessibility**: ARIA labels and keyboard navigation support

## Architecture

```
src/
├── Components/          # React components
│   ├── ErrorBoundary.tsx    # Global error handling
│   ├── LoadingOverlay.tsx   # Reusable loading UI
│   ├── IdentityPhoto.tsx    # Front ID card capture
│   ├── IdentityBackPhoto.tsx # Back ID card OCR
│   ├── LivenessFrontPhoto.tsx # Selfie capture
│   ├── LivenessBlink.tsx    # Blink detection
│   └── VerifyStart.tsx      # Main entry point
├── hooks/              # Custom React hooks
│   └── useOCR.ts           # OCR processing hook
├── store/              # State management
│   └── verificationStore.ts # Zustand store
├── utils/              # Utility functions
│   ├── logger.ts           # Logging utility
│   ├── faceHelper.ts       # Face extraction
│   ├── faceComparisonHelper.ts # Face matching
│   ├── livenessHelper.ts   # Blink detection
│   ├── mrzParser.ts        # MRZ parsing
│   └── imageProcessor.ts   # Image preprocessing
└── config/             # Configuration
    └── constants.ts        # App constants & env vars
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Download Face Recognition Models

The application uses `face-api.js` models for face recognition. For better performance and reliability, models are loaded from local storage instead of CDN.

**Option A: Download via NPM Script (Recommended)**

```bash
npm run setup-models
```

This will automatically clone the models repository into `public/models/`.

**Option B: Download via Git (Manual)**

```bash
# Navigate to public directory
cd public

# Clone the models repository
git clone https://github.com/justadudewhohacks/face-api.js-models.git models

# Or download specific models only (smaller size)
# Download from: https://github.com/justadudewhohacks/face-api.js-models/tree/master/weights
# Place the weights folder in public/models/
```

**Option B: Manual Download**

1. Visit: https://github.com/justadudewhohacks/face-api.js-models
2. Download the repository
3. Extract and place the contents in `public/models/` directory

**Required Models:**

- `ssd_mobilenetv1_model-weights_manifest.json` and `ssd_mobilenetv1_model-shard1`
- `face_landmark_68_model-weights_manifest.json` and `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json` and `face_recognition_model-shard1`

**Directory Structure:**

```
public/
  └── models/
      ├── ssd_mobilenetv1_model-weights_manifest.json
      ├── ssd_mobilenetv1_model-shard1
      ├── face_landmark_68_model-weights_manifest.json
      ├── face_landmark_68_model-shard1
      ├── face_recognition_model-weights_manifest.json
      └── face_recognition_model-shard1
```

**Note:** If local models are not found, the application will automatically fall back to CDN (slower but works for development).

### 3. Run Development Server

```bash
npm run dev
```

### 4. Environment Variables (Optional)

Copy `env.example` to `.env` and configure if needed:

```bash
cp env.example .env
```

Available environment variables:

- `VITE_FACE_MATCH_THRESHOLD`: Face matching threshold (default: 0.55)
- `VITE_REQUIRED_BLINKS`: Number of blinks required for liveness (default: 2)
- `VITE_BLINK_DEBOUNCE_MS`: Blink detection debounce time (default: 400)
- `VITE_ENABLE_DEBUG_MODE`: Enable debug logging (default: false)

### 5. Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### 6. Preview Production Build

```bash
npm run preview
```

## Development

### Project Structure

- **Components**: React components with lazy loading for code splitting
- **Hooks**: Custom React hooks for reusable logic (OCR processing)
- **Store**: Zustand store for global state management
- **Utils**: Utility functions for image processing, OCR, face recognition
- **Config**: Configuration constants and environment variables

### Key Technologies

- **React 19**: UI library with latest features
- **TypeScript**: Type safety
- **Vite**: Fast build tool and dev server
- **Zustand**: Lightweight state management
- **Tesseract.js**: OCR engine for MRZ reading
- **MediaPipe**: Face detection and landmarks for liveness
- **face-api.js**: Face recognition and comparison
- **Ant Design**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

## Error Handling

The application includes an `ErrorBoundary` component that catches React errors and displays a user-friendly error message. In development mode, detailed error information is shown.

## Logging

Logging is handled by the `logger` utility in `src/utils/logger.ts`. In production, only errors are logged to reduce console noise. All other log levels are automatically disabled.

## Accessibility

The application includes:

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly descriptions
- Semantic HTML structure

## Performance Optimizations

- **Code Splitting**: Routes are lazy-loaded to reduce initial bundle size
- **Memoization**: UseMemo and useCallback for expensive computations
- **Zustand Selectors**: Only subscribe to necessary state slices
- **Worker Reuse**: Tesseract OCR worker is initialized once and reused

## Troubleshooting

### Models not loading

If face-api.js models fail to load locally, the app will automatically fall back to CDN. Ensure you've run `npm run setup-models` or manually downloaded the models.

### Camera not working

- Ensure you've granted camera permissions
- Check browser console for errors
- Try a different browser (Chrome/Edge recommended for best MediaPipe support)

### OCR not working

- Ensure good lighting when capturing MRZ
- Make sure all 3 MRZ lines are clearly visible
- Try adjusting camera distance/angle

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
