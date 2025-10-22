const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

const configUMD = {
  entry: {
    all: "./src/index.ts",
  },
  mode: "production",
  output: {
    filename: "svg-export.umd.min.js",
    path: path.resolve(__dirname, "dist", "umd"),
    library: {
      name: "svgExport",
      type: "umd",
      umdNamedDefine: true,
    },
    chunkFormat: false,
  },
  externals: {
    canvg: "canvg",
    pdfkit: "pdfkit",
    "svg-to-pdfkit": "svg-to-pdfkit",
    "blob-stream": "blob-stream",
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },
    ],
  },
};

const configUMDStandalone = {
  entry: {
    all: "./src/indexStandalone.ts",
  },
  mode: "production",
  output: {
    filename: "svg-export.umd.standalone.min.js",
    path: path.resolve(__dirname, "dist", "umd"),
    library: {
      name: "svgExport",
      type: "umd",
      umdNamedDefine: true,
    },
    chunkFormat: false,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process",
    }),
  ],
  resolve: {
    symlinks: false,
    extensions: ["", ".ts", ".tsx", ".js", ".afm"],
    alias: {
      // maps fs to a virtual one allowing to register file content dynamically
      fs: "pdfkit/js/virtual-fs.js",
    },
    fallback: {
      // crypto module is not necessary at browser
      crypto: false,
      // fallbacks for native node libraries
      buffer: require.resolve("buffer/"),
      stream: require.resolve("readable-stream"),
      zlib: require.resolve("browserify-zlib"),
      util: require.resolve("util/"),
      assert: require.resolve("assert/"),
    },
  },
  module: {
    rules: [
      // bundle and load afm files verbatim
      { test: /\.afm$/, type: 'asset/source' },
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          keep_fnames: true, // for svg-to-pdfkit, https://github.com/alafr/SVG-to-PDFKit/issues/137
        },
      }),
    ],
  },
};

const configESM = {
  entry: {
    all: "./src/index.ts",
  },
  mode: "production",
  output: {
    filename: "svg-export.esm.min.js",
    path: path.resolve(__dirname, "dist", "esm"),
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"],
    alias: {
      "./importDependencyUMD": "./importDependencyESM",
    }
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/,
        extractComments: false,
        terserOptions: {
          keep_fnames: true, // for svg-to-pdfkit, https://github.com/alafr/SVG-to-PDFKit/issues/137
        },
      }),
    ],
  }
};

module.exports = (env) => {
  const config =
    env.type === "esm"
      ? configESM
      : env.type === "umdStandalone"
      ? configUMDStandalone
      : configUMD;
  if (env.mode === "dev") {
    config.mode = "development";
  }

  if (!env.type.endsWith("Standalone")) {
    config.output.clean = true;
  }
  return config;
};
