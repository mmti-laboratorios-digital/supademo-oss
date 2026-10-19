import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-12">
      <SignUp
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
