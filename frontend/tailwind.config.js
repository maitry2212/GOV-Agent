import tailwindTypography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-primary': '#1E3A8A', // Deep Blue
                'brand-secondary': '#F59E0B', // Saffron
                'brand-accent': '#10B981', // Green
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        tailwindTypography
    ],
}
