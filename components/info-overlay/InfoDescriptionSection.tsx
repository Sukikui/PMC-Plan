import { themeColors } from '@/lib/theme-colors';

export default function InfoDescriptionSection({
  description,
  preserveWhitespace = false,
}: {
  description?: string | null;
  preserveWhitespace?: boolean;
}) {
  if (!description) return null;

  return (
    <section>
      <h3 className={`mb-3 text-lg font-semibold ${themeColors.text.primary} ${themeColors.transition}`}>
        Description
      </h3>
      <p className={`${preserveWhitespace ? 'whitespace-pre-wrap' : ''} p-4 leading-relaxed ${themeColors.text.quaternary} ${themeColors.infoOverlay.descriptionBg} ${themeColors.util.roundedLg} ${themeColors.transition}`}>
        {description}
      </p>
    </section>
  );
}
