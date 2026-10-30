import type { Meta, StoryObj } from "@storybook/react";
import { DemoEditor } from "../components/editor/DemoEditor";

/**
 * DemoEditor story — testa a renderização estática do editor sem
 * server actions reais. Útil para validar layout e estado vazio.
 *
 * Para o story funcionar com auto-save, mockamos fetch global.
 */
const meta: Meta<typeof DemoEditor> = {
  title: "Editor/DemoEditor",
  component: DemoEditor,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof DemoEditor>;

export const Empty: Story = {
  args: {
    demo: {
      id: "demo-1",
      title: "Demo sem steps",
      description: "",
      slug: "demo-vazia",
      language: "pt-BR",
      status: "draft",
      leadFormEnabled: false,
      finalCta: null,
    },
    initialSteps: [],
  },
};

export const WithSteps: Story = {
  args: {
    demo: {
      id: "demo-2",
      title: "Onboarding EasyDemo",
      description: "Tour de 3 passos",
      slug: "onboarding",
      language: "pt-BR",
      status: "published",
      leadFormEnabled: true,
      finalCta: {
        type: "whatsapp",
        value: "+5511999998888",
        label: "Falar no WhatsApp",
      },
    },
    initialSteps: [
      {
        id: "s1",
        position: 1,
        screenshotR2Key: "demo/1.png",
        screenshotUrl: "https://placehold.co/1280x800/2563eb/ffffff?text=Step+1",
        sourceUrl: "https://example.com",
        sourceTitle: "Homepage",
        caption: "Bem-vindo!",
        hotspot: { type: "pointer", x: 50, y: 50, action: "next" },
      },
      {
        id: "s2",
        position: 2,
        screenshotR2Key: "demo/2.png",
        screenshotUrl: "https://placehold.co/1280x800/2563eb/ffffff?text=Step+2",
        sourceUrl: "https://example.com/dashboard",
        sourceTitle: "Dashboard",
        caption: "Seu painel.",
        hotspot: { type: "pointer", x: 30, y: 40, action: "next" },
      },
    ],
    workspaceSlug: "demo-workspace",
    workspacePlan: "pro",
  },
};
