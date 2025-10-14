import { prisma } from './prisma'

export interface ProductWithInventory {
  id: string
  sku: string
  name: string
  description?: string
  barcode?: string
  image?: string
  category: {
    id: string
    name: string
  }
  variations: ProductVariation[]
  inventory: ProductInventory[]
}

export interface ProductVariation {
  id: string
  name: string
  unitPrice: number
  costPrice: number
  weight?: number
  volume?: number
  piecesPerCarton?: number
  isActive: boolean
}

export interface ProductInventory {
  id: string
  branchId: string
  branch: {
    id: string
    name: string
  }
  quantity: number
  minStock: number
  maxStock?: number
  reorderPoint: number
  lastUpdated: Date
}

export interface ProductWithStock {
  id: string
  sku: string
  name: string
  category: string
  barcode?: string
  price: number
  stock: number
  variations?: ProductVariation[]
}

export class ProductService {
  static async getProductsForPOS(branchId: string = 'default'): Promise<ProductWithStock[]> {
    try {
      // Get all active products with their inventory for the specified branch
      const products = await prisma.product.findMany({
        where: {
          isActive: true
        },
        include: {
          category: true,
          variations: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              name: true,
              unitPrice: true,
              costPrice: true,
              weight: true,
              volume: true,
              piecesPerCarton: true,
              isActive: true
            }
          },
          inventory: {
            where: {
              branchId: branchId
            },
            select: {
              id: true,
              quantity: true,
              minStock: true,
              maxStock: true,
              reorderPoint: true,
              lastUpdated: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Transform to POS format
      return products.map(product => {
        const inventory = product.inventory[0] // Get inventory for the specified branch
        const mainVariation = product.variations[0] // Use first variation as primary price

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category.name,
          barcode: product.barcode,
          price: mainVariation?.unitPrice || 0,
          stock: inventory?.quantity || 0,
          variations: product.variations
        }
      })
    } catch (error) {
      console.error('Error fetching products for POS:', error)
      return []
    }
  }

  static async getAllProducts(branchId?: string) {
    try {
      const where = branchId ? { inventory: { some: { branchId } } } : {}

      return await prisma.product.findMany({
        where: {
          ...where,
          isActive: true
        },
        include: {
          category: true,
          variations: {
            where: {
              isActive: true
            }
          },
          inventory: branchId ? {
            where: {
              branchId
            },
            select: {
              id: true,
              quantity: true,
              minStock: true,
              maxStock: true,
              reorderPoint: true,
              lastUpdated: true,
              branch: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          } : {
            select: {
              id: true,
              quantity: true,
              minStock: true,
              maxStock: true,
              reorderPoint: true,
              lastUpdated: true,
              branch: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          batches: {
            where: {
              quantity: {
                gt: 0
              },
              OR: [
                {
                  expiryDate: null
                },
                {
                  expiryDate: {
                    gte: new Date()
                  }
                }
              ]
            },
            orderBy: {
              expiryDate: 'asc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  static async getProductById(id: string) {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variations: true,
          inventory: true,
          batches: {
            where: {
              quantity: {
                gt: 0
              },
              OR: [
                {
                  expiryDate: null
                },
                {
                  expiryDate: {
                    gte: new Date()
                  }
                }
              ]
            },
            orderBy: {
              expiryDate: 'asc'
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  static async searchProducts(query: string, branchId?: string) {
    try {
      const where: any = {
        isActive: true,
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            sku: {
              contains: query
            }
          },
          {
            barcode: {
              contains: query
            }
          }
        ]
      }

      if (branchId) {
        where.inventory = {
          some: {
            branchId
          }
        }
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          variations: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              name: true,
              unitPrice: true,
              costPrice: true,
              weight: true,
              volume: true,
              piecesPerCarton: true,
              isActive: true
            }
          },
          inventory: branchId ? {
            where: {
              branchId
            },
            select: {
              id: true,
              quantity: true,
              minStock: true,
              maxStock: true,
              reorderPoint: true,
              lastUpdated: true,
              branch: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          } : {
            select: {
              id: true,
              quantity: true,
              minStock: true,
              maxStock: true,
              reorderPoint: true,
              lastUpdated: true,
              branch: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Transform to POS format to match getProductsForPOS
      return products.map(product => {
        const inventory = product.inventory[0] // Get inventory for the specified branch
        const mainVariation = product.variations[0] // Use first variation as primary price

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category.name,
          barcode: product.barcode,
          price: mainVariation?.unitPrice || 0,
          stock: inventory?.quantity || 0,
          variations: product.variations
        }
      })
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  static async updateStock(productId: string, branchId: string, quantityChange: number) {
    try {
      // First, try to find an existing inventory record
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          productId,
          branchId
        }
      })

      if (existingInventory) {
        // Update existing record
        return await prisma.inventory.update({
          where: {
            id: existingInventory.id
          },
          data: {
            quantity: {
              increment: quantityChange
            },
            lastUpdated: new Date()
          }
        })
      } else {
        // Create new record (we need to create a batch first or find one)
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { variations: { take: 1 } }
        })

        if (!product) {
          throw new Error('Product not found')
        }

        // Create a default batch if needed
        let batch = await prisma.productBatch.findFirst({
          where: {
            productId,
            batchNumber: 'DEFAULT'
          }
        })

        if (!batch) {
          batch = await prisma.productBatch.create({
            data: {
              productId,
              variationId: product.variations[0]?.id,
              batchNumber: 'DEFAULT',
              quantity: 999999,
              costPrice: product.variations[0]?.costPrice || 0,
              supplier: 'Default Supplier'
            }
          })
        }

        // Create inventory record
        return await prisma.inventory.create({
          data: {
            productId,
            branchId,
            variationId: product.variations[0]?.id,
            batchId: batch.id,
            quantity: Math.max(0, quantityChange),
            minStock: 10,
            reorderPoint: 5,
            lastUpdated: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  }

  static async getLowStockProducts(branchId: string) {
    try {
      return await prisma.inventory.findMany({
        where: {
          branchId,
          quantity: {
            lte: prisma.inventory.fields.minStock
          }
        },
        include: {
          product: {
            include: {
              category: true,
              variations: {
                where: {
                  isActive: true
                },
                take: 1
              }
            }
          },
          branch: true
        },
        orderBy: {
          quantity: 'asc'
        }
      })
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      return []
    }
  }

  static async getCategories() {
    try {
      const categories = await prisma.category.findMany({
        where: {
          products: {
            some: {
              isActive: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      return categories.map(category => category.name)
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }
}