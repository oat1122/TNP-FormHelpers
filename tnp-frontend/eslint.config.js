// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";

// ✅ แก้ปัญหา key ที่มีช่องว่าง: trim ชื่อคีย์ทั้งหมดก่อนใช้งาน
const trimKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.trim(), v]));

const browserGlobals = trimKeys(globals.browser);
const nodeGlobals = trimKeys(globals.node);
const jestGlobals = {
  /* ใส่เฉพาะตอนต้องใช้เทส */
};

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    // รวม ignore ที่นี่ให้ ESLint เดินไวและไม่อ่าน assets ใหญ่
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".vite",
      ".cache",
      "coverage",
      "public/**",
      "src/**/*.{png,jpg,jpeg,webp,gif,ico,svg}",
      "src/**/*.{mp4,webm,mp3,wav,glb,gltf}",
      "src/**/*.{woff,woff2,ttf,otf,eot}",
      "src/**/*.{z}",
      "**/__snapshots__/**",
      "**/*.min.js",
      ".eslintcache",
      "vite.config.js.timestamp-*.mjs",
      ".env",
      ".env.*",
    ],

    languageOptions: {
      globals: {
        ...browserGlobals,
      },
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
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import จัดระเบียบ
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
        },
      ],

      // ให้ Prettier จัด format แล้วรายงานผ่าน ESLint
      "prettier/prettier": "warn",
    },

    settings: {
      react: { version: "detect" },
    },
  },

  // กติกา/สภาพแวดล้อมสำหรับไฟล์สคริปต์ Node หรือไฟล์ config ต่าง ๆ
  {
    files: ["scripts/**", "vite.config.*"],
    languageOptions: {
      globals: {
        ...nodeGlobals,
      },
    },
  },
];
