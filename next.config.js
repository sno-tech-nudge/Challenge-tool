/** @type {import('next').NextConfig} */
// pages are always fetched fresh, so a note saved a moment ago never shows up stale when a juror comes back to it
module.exports = { reactStrictMode: true, experimental: { staleTimes: { dynamic: 0 } } };
