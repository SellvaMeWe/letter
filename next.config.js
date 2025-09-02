/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle undici compatibility by excluding it from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push("undici");
    }

    // Ensure proper handling of modern JavaScript syntax
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Better handling of ES modules and modern JavaScript
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".mjs": [".mjs", ".js", ".ts", ".tsx"],
    };

    // Handle modern JavaScript syntax in node_modules
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    // Specific handling for undici and other packages with private class fields
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/(undici|@firebase)/,
      use: {
        loader: "babel-loader",
        options: {
          presets: [["@babel/preset-env", { targets: "defaults" }]],
          plugins: [
            "@babel/plugin-transform-private-methods",
            "@babel/plugin-transform-class-properties",
            "@babel/plugin-transform-private-property-in-object",
          ],
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;
