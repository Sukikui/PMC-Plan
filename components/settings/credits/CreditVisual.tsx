import Image from 'next/image';
import type { CreditVisual as CreditVisualData } from './credits-data';

const brandThemeClasses: Record<string, string> = {
  github: 'dark:brightness-0 dark:invert',
  nextdotjs: 'dark:brightness-0 dark:invert',
  prisma: 'dark:brightness-0 dark:invert',
  simpleicons: 'dark:brightness-0 dark:invert',
  vercel: 'dark:brightness-0 dark:invert',
  react: 'brightness-75 saturate-150 dark:brightness-100',
  tailwindcss: 'brightness-75 saturate-150 dark:brightness-100',
};

export function BrandMark({
  className = 'h-5 w-5',
  monochrome = false,
  name,
}: {
  className?: string;
  monochrome?: boolean;
  name: string;
}) {
  if (monochrome) {
    const mask = `url("/branding/technologies/${name}.svg") center / contain no-repeat`;

    return (
      <span
        aria-hidden="true"
        className={`inline-block bg-current ${className}`}
        style={{ mask, WebkitMask: mask }}
      />
    );
  }

  return (
    <Image
      src={`/branding/technologies/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className={`object-contain ${brandThemeClasses[name] ?? ''} ${className}`}
    />
  );
}

export default function CreditVisual({ visual }: { visual: CreditVisualData }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center"
    >
      {visual.kind === 'brand' && <BrandMark name={visual.name} className="h-6 w-6" />}
      {visual.kind === 'emoji' && <span className="text-xl leading-none">{visual.value}</span>}
      {visual.kind === 'image' && (
        <Image
          src={visual.src}
          alt=""
          width={28}
          height={28}
          className="h-8 w-8 rounded-md object-cover"
        />
      )}
    </span>
  );
}
