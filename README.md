# 开练

Vue 3 前端 + Node.js（Fastify）后端的健身训练记录。第一版能注册登录、用模板开练、按组记下重量和次数、看历史和体重曲线。

## 本地运行

需要 Node.js 20+。数据库默认用 SQLite（Prisma），不需要先装 PostgreSQL。

```bash
npm run setup
npm run dev
```

- 前端：http://localhost:5173
- API：http://localhost:3001/api/health

演示账号：`demo@kailian.app` / `demo1234`

## 目录

```
apps/web   Vue 3 + Vite + Pinia + Vue Router + Tailwind
apps/api   Fastify + Prisma + SQLite
```

前端开发时 Vite 会把 `/api` 代理到 3001，登录 cookie 走同一站点。

以后若要换成 PostgreSQL，改 `apps/api/prisma/schema.prisma` 的 `provider` 和 `DATABASE_URL` 即可，接口不用动。
