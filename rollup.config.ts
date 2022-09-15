/**
 * Rollup Config.
 */
import * as path from 'path'

import rollupPluginPeerDepsExternal from 'rollup-plugin-peer-deps-external'
import rollupPluginJSON from "@rollup/plugin-json"
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve"
// 
import rollupPluginTypescript from "@rollup/plugin-typescript"
// 
// import rollupPluginTypescript from "rollup-plugin-typescript2"
import { defineConfig, type Plugin } from "rollup"
import rollupPluginAutoExternal from "rollup-plugin-auto-external"
import rollupPluginCopy from "rollup-plugin-copy"
import rollupPluginDts from "rollup-plugin-dts"
import { terser as rollupPluginUglify } from "rollup-plugin-terser"
import rollupPluginCommonJS from 'rollup-plugin-commonjs';

import package_ from "./package.json"

const tsconfig = `tsconfig.build.json`
const entry = `src/index.ts`
const outDirectory = `dist/`

// Credits to: https://www.npmjs.com/package/slash
export const pathNormalize = (pathString: string) => {
  const isExtendedLengthPath = pathString.startsWith(`\\\\?\\`)
  // eslint-disable-next-line no-control-regex
  const hasNonAscii = /[^\u0000-\u0080]+/.test(pathString)

  if (isExtendedLengthPath || hasNonAscii) 
    return pathString

  return pathString.replace(`\\`, `/`)
}

const resolveMetaUrl = () => ({
  name: `resolveMetaUrl`,
  resolveImportMeta(property, chunk) {
    if (property === `url`) {
      return pathNormalize(`'file://${ path.relative(
        process.cwd(),
        chunk.moduleId,
      ) }'`)
    }
  },
})

/**
 * Get new instances of all the common plugins.
 */
function getPlugins() {
  return [
    // 
    // resolveMetaUrl(),
    rollupPluginCommonJS(),
    rollupPluginPeerDepsExternal(),
    rollupPluginAutoExternal(),
    rollupPluginNodeResolve(),
    rollupPluginTypescript({
      tsconfig,
    }),
    rollupPluginJSON({
      preferConst: true,
    }),
    rollupPluginUglify(),
  ] as Plugin[]
}

const common = defineConfig({
  input: entry,

  output: {
    sourcemap: false,
  },

  external: [],

  treeshake: {
    annotations: true,
    moduleSideEffects: [],
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
})

const cjs = defineConfig({
  ...common,

  output: {
    ...common.output,
    // Preserve path
    // chunkFileNames: `index.cjs`,
    // entryFileNames: `[name].cjs`,
    // preserveModulesRoot: `src`,
    // preserveModules: true,
    // dir: outDirectory
    
    // Single file
    file: package_.main,
    format: `cjs`,
  },

  plugins: getPlugins(),
})

const esm = defineConfig({
  ...common,

  output: {
    ...common.output,
    // Preserve path
    // chunkFileNames: `index.mjs`,
    // entryFileNames: `[name].mjs`,
    // preserveModulesRoot: `src`,
    // preserveModules: true,
    // dir: outDirectory
    
    // Single file
    file: package_.module,
    format: `esm`,
  },

  plugins: getPlugins(),
})

const dts = defineConfig({
  ...common,

  output: [
    {
      file: package_.exports.types.import,
      format: `esm`,
    },
    {
      file: package_.exports.types.require,
      format: `cjs`,
    },
  ],

  plugins: [
    // ?
    rollupPluginTypescript({
      tsconfig,
    }),
    rollupPluginDts(),
    rollupPluginCopy({
      targets: [
        { src: `types-legacy`, dest: `dist/node/types`, rename: `legacy` },
      ],
    }),
  ] as Plugin[],
})

export default [cjs, esm, dts]
