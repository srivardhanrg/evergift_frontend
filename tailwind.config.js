/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF6B9D',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                softPink: '#FFF0F5',
            },
            fontFamily: {
                heading: ['Fredoka', 'sans-serif'],
                body: ['Open Sans', 'sans-serif'],
            },
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                'book-close': 'book-close 0.7s ease-out',
                'fade-in-up': 'fade-in-up 0.6s ease-out 0.3s forwards',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'book-close': {
                    '0%': { transform: 'scale(0.8) rotateY(10deg)', opacity: '0' },
                    '50%': { transform: 'scale(0.95) rotateY(5deg)', opacity: '0.7' },
                    '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
                },
                'fade-in-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
