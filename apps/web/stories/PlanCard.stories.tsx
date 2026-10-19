import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

/**
 * PlanCard é construído inline em marketing/pricing (atualmente).
 * Esta story serve como referência visual de como um card de pricing
 * deve aparecer para o design system.
 */
const meta: Meta<typeof Card> = {
  title: "Marketing/PlanCard",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Free: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Free</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">R$ 0</p>
        <p className="text-sm text-muted-foreground">Para testar a plataforma</p>
        <ul className="mt-3 list-disc pl-4 text-sm">
          <li>3 demos publicadas</li>
          <li>20 steps por demo</li>
          <li>50 leads/mês</li>
        </ul>
      </CardContent>
    </Card>
  ),
};

export const Pro: Story = {
  render: () => (
    <Card className="w-80 border-primary">
      <CardHeader>
        <CardTitle>Pro</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">R$ 49/mês</p>
        <p className="text-sm text-muted-foreground">Para times pequenos</p>
        <ul className="mt-3 list-disc pl-4 text-sm">
          <li>20 demos publicadas</li>
          <li>100 steps por demo</li>
          <li>1.000 leads/mês</li>
        </ul>
      </CardContent>
    </Card>
  ),
};
