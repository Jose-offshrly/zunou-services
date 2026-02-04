import { relative, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const rename = (
  _fileName: string,
  _fileExtension: string,
  fullPath: string,
) => {
  const currentDir = resolve(__dirname)
  const relativePath = relative(currentDir, fullPath)
  return relativePath
}

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
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          overwrite: 'error',
          src: 'src/**/locales/*.json',
          dest: './',
          rename,
        },
      ],
    }),
  ],
  resolve: {
    alias: [
      {
        find: '~',
        replacement: resolve(__dirname, 'src'),
      },
      {
        find: '@zunou-graphql',
        replacement: resolve(__dirname, '../../lib/zunou-graphql'),
      },
      {
        find: '@zunou-queries',
        replacement: resolve(__dirname, '../../lib/zunou-queries'),
      },
      {
        find: '@zunou-react',
        replacement: resolve(__dirname, '../../lib/zunou-react'),
      },
    ],
  },
})
