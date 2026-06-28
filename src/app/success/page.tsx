import { Suspense } from 'react';
import { SuccessContent } from './success-content';

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
