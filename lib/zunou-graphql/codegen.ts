import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  ignoreNoDocuments: false,
  generates: {
    './core/': {
      config: {
        scalars: {
          Date: 'string',
          DateTime: 'string',
          Map: 'Record<string, unknown>',
          Time: 'string',
          UUID: 'string',
        },
      },
      documents: ['../zunou-queries/core/**/*.ts'],
      preset: 'client',
      plugins: [],
      schema: process.env.VITE_CORE_GRAPHQL_URL as string,
    },
  },
}

export default config
