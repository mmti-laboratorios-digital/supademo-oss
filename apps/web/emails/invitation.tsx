import * as React from "react";

export type InvitationEmailProps = {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  role: "admin" | "editor" | "viewer";
  locale: "pt-BR" | "en";
};

export function InvitationEmail({
  workspaceName,
  inviterName,
  inviteUrl,
  role,
  locale,
}: InvitationEmailProps) {
  const copy =
    locale === "pt-BR"
      ? {
          title: `${inviterName} convidou você para o ${workspaceName}`,
          body: `Você foi convidado para colaborar como ${roleToPt(role)}. Clique no botão abaixo para aceitar.`,
          cta: "Aceitar convite",
          expires: "Este link expira em 7 dias.",
        }
      : {
          title: `${inviterName} invited you to ${workspaceName}`,
          body: `You've been invited to collaborate as a ${role}. Click the button below to accept.`,
          cta: "Accept invitation",
          expires: "This link expires in 7 days.",
        };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>{copy.title}</h1>
      <p style={{ color: "#475569", marginBottom: "16px" }}>{copy.body}</p>
      <p style={{ marginBottom: "16px" }}>
        <a
          href={inviteUrl}
          style={{
            background: "#2563eb",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          {copy.cta}
        </a>
      </p>
      <p style={{ color: "#94a3b8", fontSize: "12px" }}>{copy.expires}</p>
    </div>
  );
}

function roleToPt(role: "admin" | "editor" | "viewer"): string {
  switch (role) {
    case "admin":
      return "administrador";
    case "editor":
      return "editor";
    case "viewer":
      return "visualizador";
  }
}
