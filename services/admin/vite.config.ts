// export default config

import path from 'path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      // See https://medium.com/@fael-atom/struggling-with-vite-and-mui-42f3f5e0658d
      '@emotion/styled',
      // See https://github.com/mui/material-ui/issues/32727#issuecomment-1553100858
      '@mui/icons-material',
    ],
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '~',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@zunou-graphql',
        replacement: path.resolve(__dirname, '../../lib/zunou-graphql'),
      },
      {
        find: '@zunou-queries',
        replacement: path.resolve(__dirname, '../../lib/zunou-queries'),
      },
      {
        find: '@zunou-react',
        replacement: path.resolve(__dirname, '../../lib/zunou-react'),
      },
    ],
  },
})
