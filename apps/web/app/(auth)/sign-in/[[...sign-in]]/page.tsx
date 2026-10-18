import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-12">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#2563eb",
            borderRadius: "0.5rem",
          },
        }}
      />
    </main>
  );
}