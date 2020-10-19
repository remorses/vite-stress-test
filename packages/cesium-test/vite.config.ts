import type { UserConfig } from 'vite'
import * as vpr from 'vite-plugin-react'

module.exports = {
    jsx: 'react',
    optimizeDeps: {
        auto: true,
        exclude: ['@yarnpkg/fslib', '@yarnpkg/pnpify'],
        allowNodeBuiltins: ['@yarnpkg/fslib'],
        link: ['package-b'],
    },
    // plugins: [vpr],

    resolvers: [
        {
            alias(id) {
                const isProd = process.env.NODE_ENV === 'production'
                if (id === 'react' || id === '@pika/react') {
                    return isProd
                        ? '@pika/react'
                        : '@pika/react/source.development.js'
                }
                if (id === 'react-dom' || id === '@pika/react-dom') {
                    return isProd
                        ? '@pika/react-dom'
                        : '@pika/react-dom/source.development.js'
                }
            },
        },
    ],
} as UserConfig
