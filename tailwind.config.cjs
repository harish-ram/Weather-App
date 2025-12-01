module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				accent: '#0ea5a4',
				glass: 'rgba(255,255,255,0.06)'
			},
			keyframes: {
				float: {
					'0%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' },
					'100%': { transform: 'translateY(0)' }
				}
			},
			animation: {
				float: 'float 6s ease-in-out infinite'
			}
		}
	},
	plugins: [],
}