import {
    defaultResolver,
    makeServerFunctions,
    traverseEsModules,
} from 'es-module-traversal'
import path from 'path'
import type { ServerPlugin, UserConfig } from 'vite'
import { bundleWithEsBuild } from './esbuild'
import { printStats } from './stats'

const moduleRE = /^\/@modules\//

let alreadyProcessed = false
export function esbuildOptimizerPlugin({ entryPoints }): ServerPlugin {
    // maps /@modules/module/index.js to /web_modules/module/index.js
    const webModulesResolutions = new Map<string, string>()

    return ({ app, root, resolver, config }) => {
        const dest = path.join(root, 'web_modules')

        app.use(async (ctx, next) => {
            await next()

            if (webModulesResolutions.has(ctx.path)) {
                ctx.type = 'js'
                const resolved = webModulesResolutions.get(ctx.path)
                console.info(ctx.path, '-->', resolved)
                ctx.redirect(resolved)
                // ctx.body = await fsp.readFile(resolved)
                // ctx.status = 200
            }

            if (
                alreadyProcessed ||
                !ctx.response.is('js') ||
                !entryPoints.includes(ctx.url)
            ) {
                return
            }
            console.info('Optimizing dependencies')

            alreadyProcessed = true

            const port = ctx.port

            // serve react refresh runtime
            const traversalResult = await traverseEsModules({
                entryPoints: entryPoints.map((entry) => {
                    entry = entry.startsWith('/')
                        ? entry.slice(1)
                        : path.posix.normalize(entry)
                    return `http://localhost:${port}/${entry}`
                }),
                stopTraversing: (importPath) => {
                    return moduleRE.test(importPath) // TODO continue traversing in linked deps
                },
                ...makeServerFunctions({
                    // downloadFilesToDir: dest,
                    port,
                    root: path.resolve(root),
                }),
            })

            const installEntrypoints = Object.assign(
                {},
                ...traversalResult
                    .filter((x) => moduleRE.test(x.importPath)) // TODO remove linked deps? linked deps should be already optimized?
                    .map((x) => {
                        const k = x.importPath //.replace(moduleRE, '')
                        const importPath = x.importPath.replace(moduleRE, '')
                        const file = defaultResolver(root, importPath)
                        return {
                            [k]: file,
                        }
                    }),
            )

            // console.log({ installEntrypoints })
            const { importMap, stats } = await bundleWithEsBuild({
                dest,
                installEntrypoints,
            })

            Object.keys(importMap.imports).forEach((importPath) => {
                let resolvedFile = path.posix.resolve(
                    dest,
                    importMap.imports[importPath],
                )

                // make url always /web_modules/...
                resolvedFile = '/' + path.posix.relative(root, resolvedFile)

                // console.log(importPath, '-->', resolvedFile)
                webModulesResolutions.set(importPath, resolvedFile)
            })

            console.info(printStats(stats))
        })
    }
    // Plugin
    // add the plugin at the end of middleware
    // when the first request comes in, start taking all the imports using the traverser
    // then use fileToRequestId to get the original importPath and create the entryPoints map
    // create the bundles and save them in root/web_modules
    // add the aliases to the resolver to point to the created web_modules files
}

module.exports = {
    jsx: 'react',
    optimizeDeps: {
        auto: false,
        link: ['package-b', 'some-react-components'],
    },
    // plugins: [vpr],
    configureServer: [
        esbuildOptimizerPlugin({ entryPoints: ['/main.tsx'] }),
        ({ app }) =>
            app.use(async (ctx, next) => {
                // wait for vite history fallback
                // this redirects all valid paths to `index.html`
                await next()
                if (ctx.url === '/index.html') {
                    ctx.body = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <title>Vite App</title>
                </head>
                <body>
                  <div id="root"></div>
                  <script type="module" src="./main.tsx"></script>
                </body>
                </html>

                `
                    ctx.status = 200
                }
            }),
    ],
    resolvers: [
        {
            // requestToFile: (id, root) => {
            // // TODO does not work because paths with @modules are treated differently and need to have a package.json file
            //     console.log({ id })
            //     if (webModulesResolutions.has(id)) {
            //         const resolved = webModulesResolutions.get(id)
            //         console.log('resolving optimized ' + id + ' to ' + resolved)
            //         return resolved
            //     }
            // },
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
