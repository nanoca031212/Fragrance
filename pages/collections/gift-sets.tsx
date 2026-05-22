import { GetStaticProps } from 'next'
import { getAllProducts } from '@/lib/products'
import { Product } from '@/types/product'
import BaseCollection from '@/components/collections/BaseCollection'

interface GiftSetsPageProps {
  products: Product[]
}

export default function GiftSetsPage({ products }: GiftSetsPageProps) {
  return (
    <BaseCollection 
      products={products}
      title="Gift Sets | Premium Fragrance Collections"
      description="Shop our exclusive fragrance gift sets. Premium collections at $79.90 with fast UK delivery."
      filterFunction={(product) => product.tags.includes('gift-set')}
    />
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const allProducts = getAllProducts()
    
    return {
      props: {
        products: allProducts
      },
      revalidate: 3600 // Revalidar a cada hora
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    
    return {
      props: {
        products: []
      }
    }
  }
}