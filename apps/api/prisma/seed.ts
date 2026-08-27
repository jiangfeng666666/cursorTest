import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const exercises = [
  { name: '深蹲', muscleGroup: '腿', equipment: '杠铃' },
  { name: '罗马尼亚硬拉', muscleGroup: '腿', equipment: '杠铃' },
  { name: '弓步蹲', muscleGroup: '腿', equipment: '哑铃' },
  { name: '腿举', muscleGroup: '腿', equipment: '器械' },
  { name: '卧推', muscleGroup: '胸', equipment: '杠铃' },
  { name: '哑铃卧推', muscleGroup: '胸', equipment: '哑铃' },
  { name: '俯卧撑', muscleGroup: '胸', equipment: '自重' },
  { name: '双杠臂屈伸', muscleGroup: '胸', equipment: '自重' },
  { name: '引体向上', muscleGroup: '背', equipment: '自重' },
  { name: '高位下拉', muscleGroup: '背', equipment: '器械' },
  { name: '杠铃划船', muscleGroup: '背', equipment: '杠铃' },
  { name: '坐姿划船', muscleGroup: '背', equipment: '器械' },
  { name: '肩上推举', muscleGroup: '肩', equipment: '杠铃' },
  { name: '侧平举', muscleGroup: '肩', equipment: '哑铃' },
  { name: '面拉', muscleGroup: '肩', equipment: '绳索' },
  { name: '杠铃弯举', muscleGroup: '手臂', equipment: '杠铃' },
  { name: '绳索下压', muscleGroup: '手臂', equipment: '绳索' },
  { name: '平板支撑', muscleGroup: '核心', equipment: '自重' },
  { name: '卷腹', muscleGroup: '核心', equipment: '自重' },
  { name: '农夫行走', muscleGroup: '核心', equipment: '哑铃' },
]

async function main() {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: exercise,
      create: exercise,
    })
  }

  const demoHash = await bcrypt.hash('demo1234', 10)
  await prisma.user.upsert({
    where: { email: 'demo@kailian.app' },
    update: {},
    create: {
      email: 'demo@kailian.app',
      name: '演示',
      passwordHash: demoHash,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
