/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material You color tokens (M3 Spec)
        m3: {
          light: {
            primary: '#6750A4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#EADDFF',
            onPrimaryContainer: '#21005D',
            background: '#F7F2FA',
            onBackground: '#1C1B1F',
            surface: '#FFFFFF',
            onSurface: '#1C1B1F',
            surfaceVariant: '#E7E0EC',
            onSurfaceVariant: '#49454F',
            outline: '#79747E',
            error: '#B3261E',
            errorContainer: '#F9DEDC',
            onErrorContainer: '#410E0B',
          },
          dark: {
            primary: '#D0BCFF',
            onPrimary: '#381E72',
            primaryContainer: '#4F378B',
            onPrimaryContainer: '#EADDFF',
            background: '#141218',
            onBackground: '#E6E1E5',
            surface: '#1D1B20',
            onSurface: '#E6E1E5',
            surfaceVariant: '#49454F',
            onSurfaceVariant: '#CAC4D0',
            outline: '#938F99',
            error: '#F2B8B5',
            errorContainer: '#8C1D18',
            onErrorContainer: '#F9DEDC',
          }
        }
      },
      borderRadius: {
        'large': '24px',
        'xlarge': '32px',
      },
      boxShadow: {
        'elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
      }
    },
  },
  plugins: [],
}
