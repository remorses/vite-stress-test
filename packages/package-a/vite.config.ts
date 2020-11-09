import type { UserConfig } from 'vite'
import * as vpr from 'vite-plugin-react'

export default {
    jsx: 'react',
    optimizeDeps: {
        auto: true,
        link: ['package-b', 'some-react-components', 'linked-pkg'],
    },
    plugins: [{ resolvers: require('vite-plugin-react').resolvers }],
} as UserConfig
