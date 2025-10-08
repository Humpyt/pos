import { prisma } from '../src/lib/prisma'

async function checkCounts() {
  try {
    const products = await prisma.product.count()
    const categories = await prisma.category.count()
    const inventory = await prisma.inventory.count()
    const variations = await prisma.productVariation.count()

    console.log(`Products: ${products}`)
    console.log(`Categories: ${categories}`)
    console.log(`Inventory: ${inventory}`)
    console.log(`Variations: ${variations}`)

    // Show some sample products
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: { category: true }
    })

    console.log('\nSample products:')
    sampleProducts.forEach(p => {
      console.log(`- ${p.name} (${p.category.name})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCounts()