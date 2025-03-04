// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// // export default nextConfig;
// module.exports = {
//   reactStrictMode: true,
//   webpack: (config: any) => {
//     return config;
//   },
// };

const fileSync = require('fs');
const address = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config: any) => {
    return config;
  },
  // devServer: {
  //   https: {
  //     // key: fileSync.readFileSync(address.join(__dirname, 'localhost.key')),
  //     // cert: fileSync.readFileSync(address.join(__dirname, 'localhost.crt')),
  //     key: fileSync.readFileSync(address.join(__dirname, 'key.pem')),
  //     cert: fileSync.readFileSync(address.join(__dirname, 'cert.pem')),
  //     // key: fileSync.readFileSync(address.join(__dirname, 'PRIVATE.key')),
  //     // cert: fileSync.readFileSync(address.join(__dirname, 'PUBLIC.pem')),
  //   },
  // },
};