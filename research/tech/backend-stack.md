# Backend stack — API, filas, upload, auth, email

> Escolha de frameworks, job queues, object storage, autenticação e email transacional para o SaaS multi-tenant B2B pequeno. **Restrição:** VPS único 8 GB Hetzner, time pequeno, PT-BR first.

---

## 1. Framework principal — Next.js 15 App Router

### 1.1 Comparativo

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Next.js 15 App Router** | Fullstack (API + UI admin + landing + player route handler); RSC; Turbopack; ecossistema enorme; Vercel-ready se quiser migrar | Mais opinativo; alguma curva de App Router; cold start maior se serverless | ✅ **Escolhido** |
| NestJS | Excelente para backend puro; DI robusto; bom para times >5; | Não renderiza UI; precisa de front React separado; mais boilerplate | ❌ overhead desnecessário |
| Express + React | Flexível total | Você refaz o que Next já dá (SSR, routing, middleware, build) | ❌ reinventar a roda |
| Remix | Roteamento nested + loaders; bom DX | Ecossistema menor; menos opções de deploy; Vercel comprou mas comunidade migrou para Next | ❌ ecossistema |
| SvelteKit | Bundle menor; rápido | Time não conhece; ecossistema React (Shadcn, Framer, etc.) não reusa | ❌ custo de migração |

**Decisão:** **Next.js 15 App Router**. Documentação oficial de multi-tenant: <https://nextjs.org/docs/15/app/guides/multi-tenant>.

### 1.2 Estrutura de rotas sugerida

```
app/
  (marketing)/                 # site público
    page.tsx
    pricing/
  (auth)/
    sign-in/
    sign-up/
  (app)/                       # logado — workspace do cliente
    layout.tsx
    demos/
      page.tsx
      [id]/edit/
      [id]/analytics/
    workspace/
      settings/
      members/
    billing/
  (public)/                    # sem auth — serve player e embeds
    d/[slug]/                  # página pública do demo (SEO)
    embed/[id]/                # rota carregada pelo iframe
  api/
    v1/
      demos/
      upload/                  # multipart presigned
      webhooks/
        asaas/
        stripe/
        s3/
      events/                  # analytics
      auth/
```

Rota `app/api/v1/demos/route.ts`:

```ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const demo = await db
    .insert(demos)
    .values({ ...body, workspaceId: getWorkspaceId(userId) })
    .returning();
  return Response.json(demo);
}
```

### 1.3 Versão e libs

- `next@15.x` (App Router estável, React 19)
- `react@19`, `react-dom@19`
- `@vercel/og` (imagens OG dinâmicas para demos)
- `next-themes` para dark/light no admin
- `@upstash/ratelimit` se quiser rate limit (alternativa: Cloudflare Turnstile)

---

## 2. Filas / workers — Postgres-only com `graphile-worker`

### 2.1 Comparativo

| Opção | Quando usar | Não usar quando |
|-------|-------------|-----------------|
| **`graphile-worker`** (Postgres) | **Time pequeno**, quer simplicidade, < 100 jobs/s, quer queries SQL direto na fila | Latência sub-ms; > 500 jobs/s sustentados |
| **BullMQ + Redis** | Alta taxa (>1k jobs/s), precisa de rate limiting, prioridades avançadas, multi-instância nativa | Não quer manter Redis (custa $15-50/mês em ElastiCache; ou é mais infra) |
| **SQS/RabbitMQ** | Multi-região, multi-cloud, time com SRE dedicado | 1 VPS, time pequeno |
| **Inngest / Trigger.dev** | Step functions, retries complexos, visual workflow editor | Lock-in; custo; LGPD (servidor fora BR) |

### 2.2 Decisão: **`graphile-worker`**

**Por quê:**
- Zero infra extra (mesmo Postgres).
- Benchmark: 180k jobs/s em tarefas triviais — mais que suficiente para SaaS B2B pequeno.
- Transacional: pode enfileirar dentro da mesma transaction do INSERT principal (evita perda de jobs se processo cair).
- Cron nativo (ideal para cleanup de demos expirados, retenção LGPD, etc).
- Self-hostável.
- 2026 update: BullMQ agora também suporta Postgres backend opcional (`createPostgresBackend`); mas `graphile-worker` é mais maduro e simples para Postgres-only.

**Fonte:** <https://worker.graphile.org/docs> | <https://github.com/graphile/worker> | <https://docs.bullmq.io/guide/postgresql>

**Jobs que entram na fila:**
- `process_uploaded_demo` — extrair metadados, gerar thumbnails (Remotion ou sharp).
- `redact_sensitive_fields` — aplicar blur via OCR (Tesseract.js + regex).
- `generate_video_mp4` — renderizar vídeo com Remotion (se cliente pediu).
- `send_invitation_email` — Resend.
- `sync_billing_event` — Asaas/Stripe webhook.
- `cleanup_expired_demos` — cron diário (LGPD retention).

### 2.3 Setup

```ts
// src/lib/queue.ts
import { run, makeWorkerUtils, TaskList } from 'graphile-worker';

const taskList: TaskList = {
  'process_uploaded_demo': async (payload, helpers) => {
    // ...
  },
  'redact_sensitive_fields': async (payload, helpers) => {
    // ...
  },
};

async function main() {
  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList,
  });
  await runner.promise;
}
main().catch(console.error);
```

### 2.4 Quando migrar para BullMQ

Sinais:
- Latência de enqueue→pickup de um > 1s (Postgres LISTEN/NOTIFY bate 10k jobs/s mas sim overhead).
- BullMQ tem features que você precisa: groups, parent/child dependencies, rate limiter nativo por job key.
- Está escalando para > 3 instâncias da API.

**Custo de migração:** baixo se você isolou bem a interface de queue (`addJob('task', payload)` wrapper).

---

## 3. Upload de mídia — Cloudflare R2 com S3-compatible API

### 3.1 Comparativo

| Opção | Free tier | Egress | Custo p/ GB-mês | Indicado para |
|-------|-----------|--------|-----------------|---------------|
| **Cloudflare R2** | 10 GB storage + 1M writes + 10M reads/mês | **GRÁTIS** | $0.015 | SaaS com público leitor de demos — **nosso caso** |
| AWS S3 Standard | 100 GB egress/mês (12 meses) | $0.09/GB (após free tier) | $0.023 | Stack AWS existente |
| MinIO (self-host) | ∞ | ∞ (você paga infra) | ∞ | Compliance extremo (dados não saem do país) |
| Upstash Blob | 1 GB storage, 10 GB bandwidth (free); 1 TB egress depois | $0 até 1 TB | $0.02 | < 1 TB egress |
| Vercel Blob | 1 GB storage, 10 GB transfer (Hobby) | $0.05/GB | $0.023 | Já está na Vercel |

**Decisão: Cloudflare R2.** Único cenário que vence S3 em SaaS público: **egress grátis**. Para nosso player público servindo imagens WebP, isso economiza centenas de reais/mês em comparação com S3.

**Fonte:** <https://developers.cloudflare.com/r2/pricing/> | <https://www.cloudflare.com/r2>

### 3.2 Stack de upload

#### 3.2.1 Presigned URLs (upload direto browser → R2)

```ts
// app/api/v1/upload/sign/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  const { demoId, stepId, contentType } = await req.json();
  const key = `demos/${demoId}/steps/${stepId}.${contentType.split('/')[1]}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
    ContentLengthRange: { Min: 1024, Max: 5 * 1024 * 1024 },
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 600 });
  return Response.json({ url, key, publicUrl: `${process.env.R2_PUBLIC}/${key}` });
}
```

Cliente faz PUT direto no R2 — não passa pelo Next.js. Reduz banda no VPS em 95%.

#### 3.2.2 Multipart upload (arquivos > 50 MB)

R2 suporta nativamente (multipart = várias Class A operations). Para vídeos (até 100 MB) usamos o pattern:

```ts
import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

const init = await s3.send(new CreateMultipartUploadCommand({ Bucket, Key, ContentType }));
// Para cada chunk de 5 MB:
const presignedUrl = await getSignedUrl(s3, new UploadPartCommand({ Bucket, Key, UploadId: init.UploadId, PartNumber: i }), { expiresIn: 3600 });
// Cliente faz PUT chunk-by-chunk
// Backend recebe ETags e chama CompleteMultipartUploadCommand
```

**Limites a respeitar:**
- Part size: 5 MB mínimo (exceto último), máximo 5 GB.
- Max 10.000 parts.
- R2 multipart > 100 MB parte uma única Class A operation por parte; < 100 MB conta como 1 PUT.

### 3.3 Lifecycle policies

Política automática que apaga arquivos órfãos (upload incompleto) e aplica retenção LGPD.

```json
{
  "Rules": [
    {
      "Id": "ExpireIncompleteUploads",
      "Status": "Enabled",
      "Filter": { "Prefix": "demos/" },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    },
    {
      "Id": "LgpdRetention",
      "Status": "Enabled",
      "Filter": { "Prefix": "demos/" },
      "Expiration": { "Days": 365 }
    }
  ]
}
```

### 3.4 Versionamento + metadata

Habilitar versionamento para que clientes possam recuperar versões antigas de demos editados. Custo extra de storage, mas barato com R2 ($0.0045/GB-mês para histórico).

---

## 4. Autenticação — Clerk

### 4.1 Comparativo

| Opção | Custo em 10k MAU | B2B orgs | SSO | Lock-in | Open source |
|-------|-----------------|----------|-----|---------|-------------|
| **Clerk** | $25/mo Pro | Nativo, first-class | Incluído Pro ($25 incl. 1 SSO) | Médio (exporta user hashes) | Não |
| **Auth.js / NextAuth** | Free self-hosted | DIY | DIY (plugin paid) | Zero | nenhum |
| **Lucia** | Free self-hosted | DIY | DIY | Zero | ✅ MIT |
| **Supabase Auth** | Free até 50k MAU; SAML Pro+ | DIY (não tem nativo) | Pago | Baixo | ✅ MIT |
| **WorkOS AuthKit** | Free até 1M MAU; SSO $125/mo | Nativo | Pago por connection ($125) | Baixo | Não |

**Fonte:** <https://clerk.com/articles/clerk-pricing-explained> | <https://clerk.com/articles/authentication-tools-for-nextjs>

### 4.2 Decisão: **Clerk**

**Por quê:**
- **Org nativo** (workspaces) — essencial para B2B multi-tenant.
- SSO Enterprise **incluso** em Pro ($25/mo com 1 SSO vs $125/mo do WorkOS).
- SDK Next.js 15+ no dia 1 (já suporta `proxy.ts` do Next 16).
- Componentes UI pré-construídos (sign-in, sign-up, user button, organization switcher).
- Supabase RLS integrado via JWT (se optarmos por Supabase no futuro).
- User data exportável (lock-in baixo).
- Free tier: 50k MAU (feb/2026).

**Quando NÃO usar Clerk:** se quiser 100% self-host open source, ou se org precisa de workforce identity (departamentos, governance). Para nosso SaaS B2B pequeno, Clerk é ideal.

### 4.3 Configuração mínima

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher([
  '/(app)/:path*',
  '/api/v1/demos/:path*',
  '/api/v1/upload/:path*',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
```

```tsx
// app/(app)/layout.tsx
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <OrganizationSwitcher />
        <UserButton />
      </header>
      {children}
    </>
  );
}
```

### 4.4 Sincronização Clerk → Postgres

Cada vez que `organization.created` ou `user.joined` acontece, o webhook do Clerk chama nossa API e espelha o mínimo no Postgres (id + slug + name) para RLS e auditoria.

```ts
// app/api/v1/webhooks/clerk/route.ts
import { Webhook } from 'svix';

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(payload, headers) as any;

  if (evt.type === 'organization.created') {
    await db.insert(workspaces).values({
      clerkOrgId: evt.data.id,
      slug: evt.data.slug,
      name: evt.data.name,
    });
  }
  // ...
}
```

---

## 5. Email transacional — Resend

### 5.1 Comparativo

| Opção | Free tier | Custo 50k/mês | DX | React Email | Indicado |
|-------|-----------|---------------|----|-------------|----------|
| **Resend** | 3k (100/dia) | $20/mo | Excelente | ✅ first-class | Modern stack |
| Postmark | 100 | $55 | Bom | ❌ | Equipes que já usam |
| AWS SES | até $200 credits | ~$5 + infra | **Ruim** | ❌ | AWS-native, alta escala |
| SendGrid | 100/dia 60 dias | $19.95 | Médio | ❌ | Marketing+transacional |

**Fontes:** <https://resend.com/pricing?product=transactional> | <https://www.brevo.com/blog/amazon-ses-alternatives> | <https://www.sequenzy.com/versus/resend-vs-postmark>

### 5.2 Decisão: **Resend**

**Por quê:**
- React Email (`@react-email/components`) para templates tipados.
- SDK Node.js first-class, webhooks simples.
- Free tier útil em dev.
- $20/mo Pro com 50k emails (mais que suficiente).
- LGPD: data region US ou EU; emails transacionais geralmente não contêm PII massiva (mas temos cuidado com logs).
- Inbox placement bom (não o melhor — Postmark ganha, mas Resend é "suficiente" e DX é imbatível).

### 5.3 Templates com React Email

```tsx
// emails/invitation.tsx
import { Button, Heading, Section, Text } from '@react-email/components';

export default function InvitationEmail({ url, inviterName, orgName }: Props) {
  return (
    <Section>
      <Heading>{inviterName} convidou você para {orgName}</Heading>
      <Text>Clique abaixo para aceitar o convite.</Text>
      <Button href={url}>Aceitar convite</Button>
    </Section>
  );
}
```

```ts
// lib/email.ts
import { Resend } from 'resend';
import InvitationEmail from '@/emails/invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitation(to: string, props: Props) {
  return resend.emails.send({
    from: 'EasyDemo <convite@easydemo.io>',
    to,
    subject: `${props.inviterName} convidou você`,
    react: InvitationEmail(props),
  });
}
```

---

## 6. Libs complementares

| Camada | Lib | Versão alvo |
|--------|-----|-------------|
| ORM | Drizzle ORM | `^0.36.0` |
| DB driver | `postgres` (Porsager) ou `pg` | `^3.4.0` |
| Validation | Zod | `^3.23.0` |
| Forms | `react-hook-form` + `@hookform/resolvers` | `^7.53.0` |
| UI components | shadcn/ui (Radix + Tailwind) | latest |
| Auth | `@clerk/nextjs` | `^6.0.0` |
| Email | `resend` + `@react-email/components` | `^4.0.0`, `^0.0.30` |
| Storage | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | `^3.680.0` |
| Queue | `graphile-worker` | `^0.16.0` |
| HTTP | `next` 15 nativo | `^15.0.0` |
| Cron | `graphile-worker` cron tasks | built-in |
| Rate limit | `@upstash/ratelimit` (opcional) ou Redis-less no Postgres | `^2.0.0` |
| Logging | `pino` + `pino-pretty` | `^9.5.0` |
| Errors | `sentry/nextjs` | `^8.0.0` |

---

## 7. Estimativa de complexidade

| Componente | tamanho | notas |
|------------|---------|-------|
| Setup Next.js 15 App Router | S | boilerplate |
| Setup Drizzle + RLS multi-tenant | M | ver `database-model.md` |
| Clerk + organizations + webhooks | S | SDK pronto |
| API REST de demos (CRUD + upload sign) | M | precisa assinar URL R2 |
| graphile-worker + tasks principais | S | boilerplate |
| Templates React Email | S | boilerplate |
| Webhook Asaas/Stripe com idempotência | M | edge case prone |
| Player embed route + script loader | M | ver `public-player.md` |

**Backend completo MVP: M-L.** 3-4 sprints para 1 dev.

---

## 8. Referências

- Next.js 15 Multi-tenant guide: <https://nextjs.org/docs/15/app/guides/multi-tenant>
- Next.js Authentication guide: <https://nextjs.org/docs/app/building-your-application/authentication>
- Architecting Multi-Tenant B2B SaaS (Next.js 15 + RLS): <https://www.indujitechnologies.com/blog/multi-tenant-saas-architecture-nextjs-15-postgresql-rls-2026>
- Graphile Worker: <https://worker.graphile.org/docs> | <https://github.com/graphile/worker>
- BullMQ Postgres backend: <https://docs.bullmq.io/guide/postgresql>
- BullMQ vs graphile-worker (opinião 2026): <https://builder.aws.com/content/3B4QrCbzzdC8WKNS11BnThIuNQx/i-removed-redis-from-my-stack-and-used-postgresql-for-job-queues-instead>
- Cloudflare R2 pricing: <https://developers.cloudflare.com/r2/pricing/>
- Clerk pricing explained: <https://clerk.com/articles/clerk-pricing-explained>
- NextAuth vs Clerk vs Supabase Auth 2026: <https://starterpick.com/guides/nextauth-vs-clerk-vs-supabase-auth-2026>
- Resend pricing: <https://resend.com/pricing?product=transactional>
- Resend vs Postmark vs SES vs SendGrid: <https://www.pingram.io/blog/resend-vs-postmark-vs-amazon-ses-vs-sendgrid>
- Best Amazon SES alternatives 2026: <https://www.brevo.com/blog/amazon-ses-alternatives>
- React Email: <https://react.email/docs/introduction>