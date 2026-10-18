import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Storybook config para apps/web.
 * Foco: DemoPlayer, DemoEditor, StepCard e PlanCard.
 *
 * Para rodar: pnpm storybook
 */
const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(ts|tsx|js|jsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;