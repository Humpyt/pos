const { PrismaClient } = require('@prisma/client');

async function createInventory() {
  const prisma = new PrismaClient();
  try {
    // Get all branches, products, and variations
    const branches = await prisma.branch.findMany();
    const products = await prisma.product.findMany({
      include: { variations: true }
    });

    let inventoryCreated = 0;

    // Create a default batch for each product variation
    for (const product of products) {
      for (const variation of product.variations) {
        const defaultBatch = await prisma.productBatch.create({
          data: {
            productId: product.id,
            variationId: variation.id,
            batchNumber: 'DEFAULT',
            quantity: 999999, // Large enough quantity
            costPrice: variation.costPrice,
            supplier: 'Default Supplier'
          }
        });

        // Create inventory for each branch using this batch
        for (const branch of branches) {
          await prisma.inventory.create({
            data: {
              branchId: branch.id,
              productId: product.id,
              variationId: variation.id,
              batchId: defaultBatch.id,
              quantity: Math.floor(Math.random() * 100) + 10,
              minStock: 10,
              maxStock: 200,
              reorderPoint: 20
            }
          });
          inventoryCreated++;
        }
      }
    }

    console.log(`Created ${inventoryCreated} inventory records`);

  } catch (error) {
    console.error('Error creating inventory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInventory();