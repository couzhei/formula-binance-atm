// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
module.exports = {
  reactStrictMode: true,
  webpack: (config: any) => {
    return config;
  },
};

// next.config.js
const fs = require('fs');
const path = require('path');

module.exports = {
  devServer: {
    https: {
      key: fs.readFileSync(path.join(__dirname, 'localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, 'localhost.crt')),
    },
  },
};