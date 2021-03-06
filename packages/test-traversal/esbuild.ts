import { build as esbuild, Metadata } from 'esbuild'

// async function main() {
//   await esbuild({
//     entryPoints: ['lodash-es'],
//     bundle: true,
//     splitting: true,
//     format: 'esm',
//     outdir: 'dist'
//   })
// }

// main()

import { invert, merge } from 'lodash/fp'
import fs from 'fs'
import path from 'path'
import toUnixPath from 'slash'
import rimraf from 'rimraf'
import tmpfile from 'tmpfile'
import { DependencyStatsOutput } from './stats'

export async function bundleWithEsBuild({
    installEntrypoints = {} as Record<string, string>,
    dest: destLoc,
    ...options
}) {
    const {
        env = {},
        alias = {},
        externalPackages = [],
        minify = false,
    } = options

    const metafile = path.join(destLoc, './meta.json')
    const entryPoints = [...Object.values(installEntrypoints)]

    const tsconfigTempFile = tmpfile('.json')
    await fs.promises.writeFile(tsconfigTempFile, makeTsConfig({ alias }))

    rimraf.sync(destLoc)
    await esbuild({
        splitting: true, // needed to dedupe packages
        external: externalPackages,
        minifyIdentifiers: Boolean(minify),
        minifySyntax: Boolean(minify),
        minifyWhitespace: Boolean(minify),
        mainFields: ['browser:module', 'module', 'browser', 'main'].filter(
            Boolean,
        ),
        // sourcemap: 'inline', // TODO sourcemaps panics and gives a lot of CPU load
        define: {
            'process.env.NODE_ENV': JSON.stringify('dev'),
            process: 'window', // TODO temporary workarounds to make certain packages work
            'process.env': 'window',
            global: 'window',
            ...generateEnvReplacements(env),
        },
        // TODO inject polyfills for process, ...etc
        // TODO add plugin for pnp resolution
        tsconfig: tsconfigTempFile,
        bundle: true,
        format: 'esm',
        write: true,
        entryPoints,
        outdir: destLoc,
        minify: Boolean(minify),
        logLevel: 'info',
        metafile,
    })

    await fs.promises.unlink(tsconfigTempFile)

    const meta = JSON.parse(
        await (await fs.promises.readFile(metafile)).toString(),
    )

    const importMap = metafileToImportMap({
        installEntrypoints,
        meta,
        destLoc: destLoc,
    })

    const stats = metafileToStats({ meta, destLoc })

    return { stats, importMap }
}

function makeTsConfig({ alias }) {
    const aliases = Object.keys(alias || {}).map((k) => {
        return {
            [k]: [alias[k]],
        }
    })
    const tsconfig = {
        compilerOptions: { baseUrl: '.', paths: Object.assign({}, ...aliases) },
    }

    return JSON.stringify(tsconfig)
}

type ImportMap = {
    imports: Record<string, string>
}

function metafileToImportMap(_options: {
    installEntrypoints: Record<string, string>
    meta: Metadata
    destLoc: string
}): ImportMap {
    const {
        destLoc: destLoc,
        installEntrypoints: installEntrypoints,
        meta,
    } = _options
    const inputFiles = Object.values(installEntrypoints).map((x) =>
        path.resolve(x),
    ) // TODO replace resolve with join in cwd
    const inputFilesToSpecifiers = invert(installEntrypoints)

    const importMaps: Record<string, string>[] = Object.keys(meta.outputs).map(
        (output) => {
            // chunks cannot be entrypoints
            if (path.basename(output).startsWith('chunk.')) {
                return {}
            }
            const inputs = Object.keys(meta.outputs[output].inputs).map((x) =>
                path.resolve(x),
            ) // TODO replace resolve with join in cwd
            const input = inputs.find((x) => inputFiles.includes(x))
            if (!input) {
                return {}
            }
            const specifier = inputFilesToSpecifiers[input]
            return {
                [specifier]:
                    './' +
                    toUnixPath(path.normalize(path.relative(destLoc, output))),
            }
        },
    )
    const importMap = Object.assign({}, ...importMaps)
    return { imports: importMap }
}

function metafileToStats(_options: { meta: Metadata; destLoc: string }): DependencyStatsOutput {
    const { meta, destLoc } = _options
    const stats = Object.keys(meta.outputs).map((output) => {
        const value = meta.outputs[output]
        // const inputs = meta.outputs[output].bytes;
        return {
            path: output,
            isCommon: ['chunk.'].some((x) =>
                path.basename(output).startsWith(x),
            ),
            bytes: value.bytes,
        }
    })

    function makeStatObject(value) {
        const relativePath = toUnixPath(path.relative(destLoc, value.path))
        return {
            [relativePath]: {
                size: value.bytes,
                gzip: 0, // TODO do we want to waste time compressing to show stats?
                brotly: 0,
                delta: 0,
                // gzip: zlib.gzipSync(contents).byteLength,
                // brotli: zlib.brotliCompressSync ? zlib.brotliCompressSync(contents).byteLength : 0,
            },
        }
    }

    return {
        common: Object.assign(
            {},
            ...stats.filter((x) => x.isCommon).map(makeStatObject),
        ),
        direct: Object.assign(
            {},
            ...stats.filter((x) => !x.isCommon).map(makeStatObject),
        ),
    }
}

function generateEnvReplacements(env: Object): { [key: string]: string } {
    return Object.keys(env).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(env[key])
        return acc
    }, {})
}
