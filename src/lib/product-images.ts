import { PublicProduct } from '@/types';

const editorialImages = [
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
];

export function getProductImage(product?: Pick<PublicProduct, 'id' | 'image' | 'images'> | null, index = 0) {
  if (product?.images?.length) return product.images[0];
  if (product?.image) return product.image;
  const seed = product?.id
    ? product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    : index;

  return editorialImages[seed % editorialImages.length];
}

export function getProductGallery(product?: PublicProduct | null) {
  const images = [...new Set([...(product?.images ?? []), product?.image].filter(
    (image): image is string => Boolean(image?.trim()),
  ))];

  return images.length > 0 ? images : [getProductImage(product)];
}
