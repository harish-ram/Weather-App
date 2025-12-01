import create from 'zustand'

export const useThemeStore = create(set => ({
  mode: 'auto', // 'light'|'dark'|'auto'
  setMode: (m)=>set({mode:m})
}))
