import type { UserConfig } from 'vite'
import * as vpr from 'vite-plugin-react'
import { esbuildOptimizerPlugin } from 'vite-esbuild-optimizer'

const usingEsbuild = false

module.exports = {
    jsx: 'react',
    optimizeDeps: {
        auto: !usingEsbuild,
        exclude: ['@yarnpkg/fslib', '@yarnpkg/pnpify'],
        allowNodeBuiltins: ['@yarnpkg/fslib'],
        link: ['package-b'],
    },
    plugins: [
        usingEsbuild &&
            esbuildOptimizerPlugin({
                entryPoints: ['src/index.tsx'],
                force: true,
            }),
        vpr,
    ].filter(Boolean),
} as UserConfig
