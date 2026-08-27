import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const foods = [
  { name: '鸡胸肉', category: '蛋白', servingLabel: '100g', kcal: 165, proteinG: 31 },
  { name: '鸡蛋', category: '蛋白', servingLabel: '1个', kcal: 78, proteinG: 6.5 },
  { name: '牛奶', category: '蛋白', servingLabel: '250ml', kcal: 150, proteinG: 8 },
  { name: '希腊酸奶', category: '蛋白', servingLabel: '150g', kcal: 130, proteinG: 12 },
  { name: '蛋白粉', category: '蛋白', servingLabel: '1勺', kcal: 120, proteinG: 24 },
  { name: '牛肉', category: '蛋白', servingLabel: '100g', kcal: 250, proteinG: 26 },
  { name: '豆腐', category: '蛋白', servingLabel: '100g', kcal: 76, proteinG: 8 },
  { name: '米饭', category: '主食', servingLabel: '1碗', kcal: 230, proteinG: 4.5 },
  { name: '燕麦', category: '主食', servingLabel: '50g', kcal: 190, proteinG: 6.5 },
  { name: '红薯', category: '主食', servingLabel: '200g', kcal: 172, proteinG: 3.2 },
  { name: '全麦面包', category: '主食', servingLabel: '2片', kcal: 160, proteinG: 8 },
  { name: '面条', category: '主食', servingLabel: '1碗', kcal: 280, proteinG: 8 },
  { name: '西兰花', category: '蔬菜', servingLabel: '100g', kcal: 35, proteinG: 2.4 },
  { name: '蔬菜沙拉', category: '蔬菜', servingLabel: '1份', kcal: 80, proteinG: 3 },
  { name: '香蕉', category: '水果', servingLabel: '1根', kcal: 105, proteinG: 1.3 },
  { name: '苹果', category: '水果', servingLabel: '1个', kcal: 95, proteinG: 0.5 },
  { name: '坚果', category: '加餐', servingLabel: '30g', kcal: 180, proteinG: 6 },
  { name: '无糖美式', category: '饮品', servingLabel: '1杯', kcal: 5, proteinG: 0.3 },
]

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

  for (const food of foods) {
    await prisma.food.upsert({
      where: { name: food.name },
      update: food,
      create: food,
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
