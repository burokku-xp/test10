import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'
import * as path from 'path'

const url =
  process.env.TURSO_DATABASE_URL ??
  `file:${path.resolve(process.cwd(), 'database/order_management.db')}`
const authToken = process.env.TURSO_AUTH_TOKEN
const adapter = new PrismaLibSql({ url, authToken })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 取引先マスタ
  const maker1 = await prisma.company.create({
    data: {
      name: '株式会社テクノサプライ',
      type: 'maker',
      phone: '03-1234-5678',
      email: 'info@technosupply.co.jp',
      notes: 'メイン仕入先',
    },
  })

  const maker2 = await prisma.company.create({
    data: {
      name: '精密機器製作所',
      type: 'maker',
      phone: '06-2345-6789',
      email: 'sales@seimitsu.co.jp',
    },
  })

  const customer1 = await prisma.company.create({
    data: {
      name: '大手製造業A社',
      type: 'customer',
      phone: '052-3456-7890',
      email: 'purchase@manufacturing-a.co.jp',
    },
  })

  const customer2 = await prisma.company.create({
    data: {
      name: '中堅商社B社',
      type: 'customer',
      phone: '011-4567-8901',
      email: 'order@syosha-b.co.jp',
    },
  })

  const bothCompany = await prisma.company.create({
    data: {
      name: '総合メーカーC社',
      type: 'both',
      phone: '092-5678-9012',
      email: 'biz@sogomaker-c.co.jp',
    },
  })

  // アラート設定
  await prisma.alertSetting.create({
    data: {
      settingKey: 'warning_days_before',
      settingValue: '3',
      description: '見積回答期限の何日前から警告を表示するか',
    },
  })

  const today = new Date()
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)
  const daysLater = (n: number) => new Date(today.getTime() + n * 86400000)

  // 案件1: 正常進行中
  const proj1 = await prisma.project.create({
    data: {
      projectNo: 'PJ-2024-001',
      name: '工場設備更新プロジェクト',
      makerId: maker1.id,
      customerId: customer1.id,
      makerStatus: 'quoted',
      customerStatus: 'quoting',
      description: 'A社工場の設備更新に伴う機器調達',
      startDate: daysAgo(30),
      expectedEndDate: daysLater(60),
    },
  })

  await prisma.quotationRequest.create({
    data: {
      projectId: proj1.id,
      companyId: maker1.id,
      requestNo: 'QR-2024-001',
      subject: '設備機器一式見積依頼',
      responseDeadline: daysLater(5),
      alertStatus: 'warning',
      details: '別紙仕様書参照',
    },
  })

  // 案件2: 期限超過アラート
  const proj2 = await prisma.project.create({
    data: {
      projectNo: 'PJ-2024-002',
      name: '生産ライン改修工事',
      makerId: maker2.id,
      customerId: customer1.id,
      makerStatus: 'quoting',
      customerStatus: 'quoting',
      description: '既存生産ラインの改修',
      startDate: daysAgo(15),
      expectedEndDate: daysLater(90),
    },
  })

  await prisma.quotationRequest.create({
    data: {
      projectId: proj2.id,
      companyId: maker2.id,
      requestNo: 'QR-2024-002',
      subject: '改修工事費用見積依頼',
      responseDeadline: daysAgo(2),
      alertStatus: 'overdue',
      details: '工事範囲は設計書参照',
    },
  })

  // 案件3: 整合性問題あり (A側発注済、C側未着手)
  const proj3 = await prisma.project.create({
    data: {
      projectNo: 'PJ-2024-003',
      name: '品質管理システム導入',
      makerId: maker1.id,
      customerId: customer2.id,
      makerStatus: 'ordered',
      customerStatus: 'pending',
      hasIntegrityIssue: true,
      integrityIssueDesc: 'A側発注済だがC側が未着手',
      description: '品質管理システムの新規導入',
      startDate: daysAgo(45),
      expectedEndDate: daysLater(30),
    },
  })

  const qr3 = await prisma.quotationRequest.create({
    data: {
      projectId: proj3.id,
      companyId: maker1.id,
      requestNo: 'QR-2024-003',
      subject: 'QMSシステム一式見積',
      responseDeadline: daysAgo(20),
      alertStatus: 'overdue',
    },
  })

  await prisma.quotationResponse.create({
    data: {
      quotationRequestId: qr3.id,
      amount: 2500000,
      details: '見積書添付の通り',
      validUntil: daysLater(30),
    },
  })

  await prisma.orderToMaker.create({
    data: {
      projectId: proj3.id,
      companyId: maker1.id,
      orderNo: 'PO-2024-003',
      amount: 2500000,
      deliveryDate: daysLater(20),
      status: 'ordered',
    },
  })

  // 案件4: 完了案件
  const proj4 = await prisma.project.create({
    data: {
      projectNo: 'PJ-2024-004',
      name: '自動搬送システム',
      makerId: maker1.id,
      customerId: customer2.id,
      makerStatus: 'completed',
      customerStatus: 'paid',
      description: '完了案件のサンプル',
      startDate: daysAgo(120),
      expectedEndDate: daysAgo(10),
    },
  })

  // 案件5: 期限警告
  const proj5 = await prisma.project.create({
    data: {
      projectNo: 'PJ-2024-005',
      name: '検査装置更新',
      makerId: maker2.id,
      customerId: customer1.id,
      makerStatus: 'quoting',
      customerStatus: 'quoting',
      description: '検査装置の老朽化対応',
      startDate: daysAgo(5),
      expectedEndDate: daysLater(120),
    },
  })

  await prisma.quotationRequest.create({
    data: {
      projectId: proj5.id,
      companyId: maker2.id,
      requestNo: 'QR-2024-005',
      subject: '検査装置見積依頼',
      responseDeadline: daysLater(2),
      alertStatus: 'warning',
    },
  })

  // 活動ログ
  await prisma.activityLog.create({
    data: {
      projectId: proj1.id,
      entityType: 'project',
      entityId: proj1.id,
      action: 'created',
      description: '案件を作成しました',
    },
  })

  await prisma.activityLog.create({
    data: {
      projectId: proj3.id,
      entityType: 'project',
      entityId: proj3.id,
      action: 'status_changed',
      fieldName: 'makerStatus',
      oldValue: 'quoted',
      newValue: 'ordered',
      description: 'A側ステータスを発注済に変更',
    },
  })

  console.log('✅ シードデータを投入しました')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
