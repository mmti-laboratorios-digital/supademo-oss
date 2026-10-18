import type { Preview } from "@storybook/react";
import { I18nProvider } from "../lib/i18n";

/**
 * Decorators globais: wrap em I18nProvider para t() funcionar nas stories.
 */
const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nProvider initialLocale="pt-BR">
        <Story />
      </I18nProvider>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;