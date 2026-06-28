'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicProduct } from '@/types';
import { getProductImage } from '@/lib/product-images';
import { MoneyDisplay } from '@/components/MoneyDisplay';
import { useI18n } from '@/components/client/I18nProvider';
import { useToast } from '@/components/client/ToastProvider';
import { useCartStore } from '@/store/cart.store';

interface ProductCardProps {
  product: PublicProduct;
  index?: number;
}

function statusLabel(status: string, dictionary: ReturnType<typeof useI18n>['dictionary']) {
  const normalized = status.toLowerCase();
  if (normalized === 'reserved') return dictionary.common.reserved;
  if (normalized === 'rented') return dictionary.common.rented;
  if (normalized === 'maintenance') return dictionary.common.maintenance;
  if (normalized === 'damaged') return dictionary.common.damaged;
  if (normalized === 'retired') return dictionary.common.retired;
  return dictionary.common.available;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { dictionary } = useI18n();
  const { pushToast } = useToast();
  const addProduct = useCartStore((state) => state.addProduct);
  const sizeLabel = product.size?.trim();
  const detailHref = `/products/${product.slug || product.id}`;
  const description = product.description || dictionary.product.fallbackDescription;

  return (
    <article className="product-card luxury-product-card">
      <Link href={detailHref} className="product-image-wrap luxury-product-image-wrap product-image-link" aria-label={`${dictionary.products.view_detail}: ${product.name}`}>
        <Image
          src={getProductImage(product, index)}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="product-image"
        />
        <div className="product-image-topbar">
          <span className="floating-chip luxury-chip">{product.category}</span>
          <span className="mini-rating">{statusLabel(product.status, dictionary)}</span>
        </div>
      </Link>

      <div className="product-body luxury-product-body">
        <h3>{product.name}</h3>
        <div className="product-card-info-row">
          <p className="product-availability">{description}</p>
          <div className="price-stack">
            <span className="muted" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
              {dictionary.product.productValue}: <MoneyDisplay value={product.productValue} />
            </span>
            <span className="muted">{dictionary.product.rentalPrice}</span>
            <div className="price luxury-price"><MoneyDisplay value={product.rentalPrice} /></div>
          </div>
        </div>

        <div className="product-meta-row">
          {sizeLabel ? (
            <span>
              {dictionary.product.size}: {sizeLabel}
            </span>
          ) : null}
          {product.color ? <span>{dictionary.product.color}: {product.color}</span> : null}
        </div>

        <div className="product-footer luxury-product-footer">
          <Link href={detailHref} className="ghost-btn">
            {dictionary.products.view_detail}
          </Link>
          <button
            type="button"
            aria-label={`${dictionary.products.add_to_cart}: ${product.name}`}
            title={dictionary.products.add_to_cart}
            onClick={() => {
              addProduct(product);
              pushToast({
                tone: 'success',
                title: dictionary.products.add_to_cart,
                description: product.name,
              });
            }}
            className="primary-btn cart-icon-btn"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
