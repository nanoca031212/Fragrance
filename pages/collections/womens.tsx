import { GetStaticProps } from 'next'
import { getAllProducts } from '@/lib/products'
import { Product } from '@/types/product'
import BaseCollection from '@/components/collections/BaseCollection'

interface WomensPageProps {
  products: Product[]
}

export default function WomensPage({ products }: WomensPageProps) {
  return (
    <BaseCollection 
      products={products}
      title="Women's Perfume | Premium Fragrance Collections"
      description="Shop our exclusive women's perfume collections. Premium fragrances at $79.90 with fast UK delivery."
      filterFunction={(product) => product.tags.includes('women')}
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