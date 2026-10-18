import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/demos" className="font-semibold tracking-tight">
              DemoBR
            </Link>
            <nav className="hidden gap-4 text-sm md:flex">
              <Link href="/demos" className="text-muted-foreground hover:text-foreground">
                Demos
              </Link>
              <Link href="/billing" className="text-muted-foreground hover:text-foreground">
                Cobrança
              </Link>
              <Link
                href="/workspace/settings"
                className="text-muted-foreground hover:text-foreground"
              >
                Workspace
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/demos/new">Nova demo</Link>
            </Button>
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8" },
              }}
            />
          </div>
        </div>
      </header>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}