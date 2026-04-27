import { notFound } from "next/navigation";
import DesignPreview from "../DesignPreview";
import { designVariants, getDesignVariant } from "../designVariants";

type DesignVariantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return designVariants.map((variant) => ({
    slug: variant.slug,
  }));
}

export async function generateMetadata({ params }: DesignVariantPageProps) {
  const { slug } = await params;
  const variant = getDesignVariant(slug);

  return {
    title: variant ? `${variant.name} | Internal Design Preview` : "Internal Design Preview",
  };
}

export default async function DesignVariantPage({ params }: DesignVariantPageProps) {
  const { slug } = await params;
  const variant = getDesignVariant(slug);

  if (!variant) notFound();

  return <DesignPreview variant={variant} />;
}
