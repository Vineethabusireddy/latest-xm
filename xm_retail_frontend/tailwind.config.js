/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          fadeInUp: {
            '0%': { 
              opacity: '0',
              transform: 'translateY(20px)'
            },
            '100%': { 
              opacity: '1',
              transform: 'translateY(0)'
            },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          shimmer: {
            '0%': { backgroundPosition: '-1000px 0' },
            '100%': { backgroundPosition: '1000px 0' },
          },
          scaleIn: {
            '0%': { 
              opacity: '0',
              transform: 'scale(0.9)'
            },
            '100%': { 
              opacity: '1',
              transform: 'scale(1)'
            },
          },
          slideIn: {
            '0%': { 
              opacity: '0',
              transform: 'translateX(-20px)'
            },
            '100%': { 
              opacity: '1',
              transform: 'translateX(0)'
            },
          },
          glow: {
            '0%, 100%': { 
              boxShadow: '0 0 5px rgba(255, 103, 38, 0.5), 0 0 10px rgba(255, 103, 38, 0.3)'
            },
            '50%': { 
              boxShadow: '0 0 20px rgba(255, 103, 38, 0.8), 0 0 30px rgba(255, 103, 38, 0.5)'
            },
          }
        },
        animation: {
          'fade-in': 'fadeIn 1s ease-out forwards',
          'fade-in-up': 'fadeInUp 1s ease-out forwards',
          'float': 'float 3s ease-in-out infinite',
          'shimmer': 'shimmer 2s linear infinite',
          'scale-in': 'scaleIn 0.5s ease-out forwards',
          'slide-in': 'slideIn 0.5s ease-out forwards',
          'glow': 'glow 2s ease-in-out infinite',
        },
      },
    },
    plugins: [],
  }
  