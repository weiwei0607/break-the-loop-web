/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', '"Noto Serif TC"', 'Georgia', 'serif'],
        display: ['"Fraunces"', '"Noto Serif TC"', 'serif'],
      },
      colors: {
        // 「呼吸」設計理念：暖奶油 + 鼠尾草綠。把 zinc 數階「反相」——
        // 高階(950)=最亮奶油、低階(50)=最深墨，整個 app 由暗翻亮、對比關係不變。
        zinc: {
          950: '#f5f0e5',
          900: '#ece4d6',
          800: '#e2d8c5',
          700: '#d5c8b2',
          600: '#b4a890',
          500: '#938974',
          400: '#746a58',
          300: '#5b5342',
          200: '#473f2f',
          100: '#3a3327',
          50:  '#2b2719',
        },
        // 鼠尾草綠（取代霓虹萊姆）
        brand: {
          light: '#8b9d7a',
          DEFAULT: '#6f815f',
        },
        // 火焰橘 → 柔和陶土（streak 不再催促）
        orange: {
          300: '#d9b59a',
          400: '#c89878',
          500: '#b8835f',
        },
        // 完成綠 → 鼠尾草（一致）
        green: {
          400: '#7e9168',
          500: '#6f815f',
        },
      },
      animation: {
        'in': 'fadeIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-bottom': 'slideInBottom 0.7s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'confetti-fall': 'confettiFall 1.5s ease-in forwards',
        'confetti-spin': 'confettiSpin 1.5s linear forwards',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'streak-pop': 'streakPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInBottom: {
          '0%': { opacity: '0', transform: 'translateY(3rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        confettiFall: {
          '0%': { opacity: '1', transform: 'translateY(-20px) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(100vh) rotate(720deg)' },
        },
        confettiSpin: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        streakPop: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(10px)' },
          '60%': { transform: 'scale(1.15) translateY(-3px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
