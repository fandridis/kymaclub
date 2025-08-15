const { baseConfig } = require("./base");

/** @type {import("eslint").Linter.Config} */
module.exports = {
    ...baseConfig,
    extends: [
        ...baseConfig.extends,
        "plugin:react-hooks/recommended",
        "plugin:react-refresh/recommended",
    ],
    env: {
        browser: true,
        es2020: true,
    },
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh"],
    rules: {
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
    },
}; 