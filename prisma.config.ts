import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Turso 本番: TURSO_DATABASE_URL を使用
// ローカル: DATABASE_URL (file:./database/...) を使用
const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? ''

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url,
  },
})
