import type { Meta, StoryObj } from "@storybook/react";
import { DemoPlayer } from "../components/player/DemoPlayer";

/**
 * DemoPlayer stories — focado em estados-chave do fluxo.
 */
const meta: Meta<typeof DemoPlayer> = {
  title: "Components/DemoPlayer",
  component: DemoPlayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DemoPlayer>;

const sampleSteps = [
  {
    id: "1",
    position: 1,
    screenshotUrl: "https://placehold.co/1280x800/2563eb/ffffff?text=Step+1",
    sourceUrl: "https://example.com",
    sourceTitle: "Homepage",
    caption: "Bem-vindo! Vamos começar pela tela inicial.",
    hotspot: { type: "pointer" as const, x: 50, y: 50 },
  },
  {
    id: "2",
    position: 2,
    screenshotUrl: "https://placehold.co/1280x800/2563eb/ffffff?text=Step+2",
    sourceUrl: "https://example.com/dashboard",
    sourceTitle: "Dashboard",
    caption: "Este é o seu dashboard.",
    hotspot: { type: "area" as const, x: 20, y: 20, w: 60, h: 30 },
  },
];

export const Idle: Story = {
  args: {
    demo: {
      id: "demo-1",
      slug: "demo-storybook",
      title: "Demo do DemoBR",
      description: "Storybook preview do player.",
      language: "pt-BR",
      leadFormEnabled: false,
      finalCta: null,
    },
    steps: sampleSteps,
    locale: "pt-BR",
  },
};

export const English: Story = {
  args: {
    demo: {
      id: "demo-2",
      slug: "demo-en",
      title: "DemoBR Demo",
      description: "Storybook preview.",
      language: "en",
      leadFormEnabled: false,
      finalCta: null,
    },
    steps: sampleSteps,
    locale: "en",
  },
};
