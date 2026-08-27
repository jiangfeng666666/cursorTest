# 开练

UniApp（Vue 3）前端 + Node.js（Fastify）后端的健身训练记录。一套代码可以出 H5、微信小程序和 App。

## 本地运行

需要 Node.js 20+。数据库默认用 SQLite。

```bash
npm run setup
npm run dev
```

- H5：http://localhost:5173
- API：http://localhost:3001/api/health

演示账号：`demo@kailian.app` / `demo1234`

微信小程序：

```bash
npm run dev:mp-weixin
```

然后用微信开发者工具打开 `apps/uni/dist/dev/mp-weixin`。小程序无法走 Vite 代理，请把 `apps/uni/src/utils/api.ts` 里的 API 地址改成可访问的后端地址，并在微信后台配置合法域名（开发阶段可关闭域名校验）。

## 目录

```
apps/uni   UniApp Vue3 + Vite + Pinia（H5 / 微信小程序 / App）
apps/api   Fastify + Prisma + SQLite
```

登录用 JWT：接口会返回 `token`，客户端存在本地，请求带 `Authorization: Bearer`。H5 仍兼容 cookie。
