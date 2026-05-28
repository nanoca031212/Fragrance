import { GetStaticProps } from "next";
import { getAllProducts } from "@/lib/products";
import { Product } from "@/types/product";
import BaseCollection from "@/components/collections/BaseCollection";

interface HomeProps {
  products: Product[];
}

export default function Home({ products }: HomeProps) {
  return (
    <BaseCollection
      products={products}
      title="Premium Fragrance Collections | $99.99 Each"
      description="Shop premium fragrance collections from top brands. All combos $99.99 with fast UK delivery."
    />
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const allProducts = getAllProducts();

    return {
      props: {
        products: allProducts,
      },
      revalidate: 3600, // Revalidar a cada hora
    };
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);

    return {
      props: {
        products: [],
      },
    };
  }
};
