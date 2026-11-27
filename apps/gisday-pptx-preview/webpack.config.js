const path = require('path');
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

// Built as the APIs are (see apps/mailroom-helper-nest/webpack.config.js for why each option is written out). The
// service has no dependencies of its own, so its image needs no npm install: main.js and the Dockerfile are all of it.
const configValues = {
  build: {
    default: {
      outputPath: '../../dist/apps/gisday-pptx-preview',
      main: './src/main.ts',
      tsConfig: path.join(__dirname, 'tsconfig.app.json'),
      assets: ['./src/Dockerfile'],
      target: 'node',
      compiler: 'tsc',
      outputHashing: 'none',
      sourceMap: false,
      optimization: false,
      namedChunks: false,
      vendorChunk: false
    },
    production: {
      optimization: true,
      extractLicenses: true,
      inspect: false
    }
  }
};

const configuration = process.env.NX_TASK_TARGET_CONFIGURATION || 'default';

const buildOptions = {
  ...configValues.build.default,
  ...configValues.build[configuration]
};

module.exports = {
  output: { library: { type: 'commonjs' } },
  plugins: [new NxAppWebpackPlugin(buildOptions)]
};
