import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'remotion', '@remotion/player'],
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'remotion': path.resolve(__dirname, './node_modules/remotion'),
      '@remotion/player': path.resolve(__dirname, './node_modules/@remotion/player')
    }
  }
})
