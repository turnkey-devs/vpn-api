require('ts-node').register({
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'node',
  },
  transpileOnly: true,
})

module.exports = require('./rollup.config.ts')
