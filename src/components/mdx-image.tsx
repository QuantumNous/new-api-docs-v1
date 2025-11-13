import Image, { type ImageProps } from 'next/image';
import { withBasePath } from '@/lib/base-path';

/**
 * MDX Image component with automatic basePath handling
 */
export function MDXImage(
  props: ImageProps | React.ImgHTMLAttributes<HTMLImageElement>
) {
  const { src, width, height, ...rest } = props;

  // Handle missing src
  if (!src) {
    return null;
  }

  // Only add basePath to string paths, not imported images or external URLs
  const processedSrc = typeof src === 'string' ? withBasePath(src) : src;

  // If we have numeric width/height, use Next.js Image component
  if (typeof width === 'number' && typeof height === 'number') {
    return (
      <Image
        src={processedSrc}
        width={width}
        height={height}
        {...(rest as any)}
        unoptimized
      />
    );
  }

  // Otherwise use native img tag with basePath
  return (
    <img src={processedSrc as string} width={width} height={height} {...rest} />
  );
}
