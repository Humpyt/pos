const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient();
  try {
    const productCount = await prisma.product.count();
    console.log('Total products in database:', productCount);

    const categoryCount = await prisma.category.count();
    console.log('Total categories in database:', categoryCount);

    const inventoryCount = await prisma.inventory.count();
    console.log('Total inventory records:', inventoryCount);

    if (productCount > 0) {
      const firstProduct = await prisma.product.findFirst({
        include: {
          category: true,
          variations: true
        }
      });
      console.log('First product:', firstProduct.name, 'in category:', firstProduct.category.name);
    }
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();