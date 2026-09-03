/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

try {
  const srcSign = path.join(__dirname, 'sign1.png');
  const destSign = path.join(__dirname, 'public', 'sign1.png');
  if (fs.existsSync(srcSign)) {
    fs.copyFileSync(srcSign, destSign);
  }
} catch (_e) {}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;

