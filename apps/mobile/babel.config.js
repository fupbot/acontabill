module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Lets `import migrations from "./drizzle/migrations"` inline the
    // generated .sql migration files as plain strings at build time, so
    // they end up bundled into the app instead of read from disk at
    // runtime (mobile apps can't read arbitrary files off disk anyway).
    plugins: [["inline-import", { extensions: [".sql"] }]],
  };
};
