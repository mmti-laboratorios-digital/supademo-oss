import type { Meta, StoryObj } from "@storybook/react";
import { StepCard } from "../components/editor/StepCard";

const meta: Meta<typeof StepCard> = {
  title: "Editor/StepCard",
  component: StepCard,
};

export default meta;
type Story = StoryObj<typeof StepCard>;

const sampleStep = {
  id: "step-1",
  position: 1,
  screenshotR2Key: "demo/step-1.png",
  sourceUrl: "https://example.com/pricing",
  sourceTitle: "Página de preços",
  caption: "Aqui o usuário escolhe o plano.",
  hotspot: { type: "pointer" as const, x: 50, y: 50 },
};

export const Default: Story = {
  args: {
    step: sampleStep,
    index: 0,
    total: 5,
    onMoveUp: () => {
      /* noop */
    },
    onMoveDown: () => {
      /* noop */
    },
    onRemove: () => {
      /* noop */
    },
    onCaptionChange: () => {
      /* noop */
    },
  },
};