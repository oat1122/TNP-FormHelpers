// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // base rules ของ ESLint
  js.configs.recommended,

  // กติกาหลักสำหรับไฟล์โค้ด
  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    // ✅ รวม ignore ไว้ที่เดียว (แทน .eslintignore/.prettierignore)
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".vite",
      ".cache",
      "coverage",
      "public/**",
      // assets/binaries ใน src
      "src/**/*.{png,jpg,jpeg,webp,gif,ico,svg}",
      "src/**/*.{mp4,webm,mp3,wav,glb,gltf}",
      "src/**/*.{woff,woff2,ttf,otf,eot}",
      "src/**/*.{z}",
      // misc
      "**/__snapshots__/**",
      "**/*.min.js",
      ".eslintcache",
      "vite.config.js.timestamp-*.mjs",
      ".env",
      ".env.*",
    ],

    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      // React
      "react/react-in-jsx-scope": "off", // Vite/Next ไม่ต้อง import React
      "react/prop-types": "off", // ถ้าไม่ได้ใช้ PropTypes ให้ปิด

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // import hygiene
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
        },
      ],

      // ให้ Prettier เป็นคนจัด format แล้วรายงานผ่าน ESLint
      "prettier/prettier": "warn",
    },

    settings: {
      react: { version: "detect" },
    },
  },

  // กติกาเฉพาะไฟล์ทดสอบ/สคริปต์ Node
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "scripts/**", "vite.config.*"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
];
