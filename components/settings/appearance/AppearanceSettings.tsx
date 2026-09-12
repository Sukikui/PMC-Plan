'use client';

import ThemeSelector from '@/components/settings/ThemeSelector';
import { Fragment, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import MainMapBackground from '@/components/map/MainMapBackground';
import { useMapAppearance } from '@/components/preferences/PreferencesProvider';
import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';
import SectionSeparator from '@/components/ui/SectionSeparator';
import RangeSlider from '@/components/ui/RangeSlider';
import { OVERWORLD_MAP_WORLD, NETHER_MAP_WORLD } from '@/lib/map/metadata';
import type { AppTheme } from '@/lib/preferences';

const visibilityOptions = [
  { label: 'Activé', value: 'enabled' },
  { label: 'Désactivé', value: 'disabled' },
] as const;
const borderLabels = ['Aucune', 'Fine', 'Moyenne', 'Épaisse'];
const preferenceRowClassName = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6';
const sliderRowClassName = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-6';
const preferenceLabelClassName = `text-sm font-normal ${themeColors.text.secondary}`;

type AppearanceSetting = {
  label: string;
  type: 'toggle';
  value: boolean;
  onChange: (value: boolean) => void;
} | {
  label: string;
  labels: string[];
  type: 'slider';
  value: number;
  onChange: (value: number) => void;
};

interface AppearanceSettingsProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  active: boolean;
}

export default function AppearanceSettings({ theme, onThemeChange, active }: AppearanceSettingsProps) {
  const [previewImagePortalRoot, setPreviewImagePortalRoot] = useState<HTMLDivElement | null>(null);
  const appearance = useMapAppearance();
  const settings: AppearanceSetting[] = [
    { label: 'Afficher les icônes au zoom', type: 'toggle', value: appearance.zoomIconsEnabled, onChange: appearance.setZoomIconsEnabled },
    { label: 'Afficher les libellés au zoom', type: 'toggle', value: appearance.zoomLabelsEnabled, onChange: appearance.setZoomLabelsEnabled },
    { label: "Afficher l'espace dominant au zoom", type: 'toggle', value: appearance.dominantSpaceIndicatorEnabled, onChange: appearance.setDominantSpaceIndicatorEnabled },
    { label: "Afficher l'image principale au survol", type: 'toggle', value: appearance.imagePreviewsEnabled, onChange: appearance.setImagePreviewsEnabled },
    { label: 'Toujours afficher les coordonnées du pointeur', type: 'toggle', value: appearance.pointerCoordinatesEnabled, onChange: appearance.setPointerCoordinatesEnabled },
    { label: 'Afficher les axes du Nether', type: 'toggle', value: appearance.netherAxesEnabled, onChange: appearance.setNetherAxesEnabled },
    { label: 'Bordure des points semi-transparente', type: 'toggle', value: appearance.translucentPointBorders, onChange: appearance.setTranslucentPointBorders },
    { label: 'Taille des points', labels: ['Petite', 'Standard', 'Grande', 'Très grande'], type: 'slider', value: appearance.pointSize, onChange: appearance.setPointSize },
    { label: 'Épaisseur des bordures des points', labels: borderLabels, type: 'slider', value: appearance.pointBorderLevel, onChange: appearance.setPointBorderLevel },
  ];
  return (
    <div className="relative">
      <div
        ref={setPreviewImagePortalRoot}
        className="pointer-events-none absolute inset-0 z-20"
      />
      <section>
        <h3 className={`mb-3 text-sm font-medium ${themeColors.text.primary}`}>
          Thème
        </h3>
        <ThemeSelector value={theme} onChange={onThemeChange} showLabel={false} />
      </section>
      <SectionSeparator className="my-6" />
      <section>
        <h3 className={`mb-3 text-sm font-medium ${themeColors.text.primary}`}>
          Personnalisation de la carte
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {([OVERWORLD_MAP_WORLD, NETHER_MAP_WORLD] as const).map((world) => (
            <div
              key={world}
              className={`relative h-48 min-w-0 overflow-hidden rounded-2xl border sm:h-64 ${themeColors.border.primary}`}
            >
              {active && (
                <MainMapBackground
                  world={world}
                  preview
                  previewImagePortalRoot={previewImagePortalRoot}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6">
          {settings.map((setting, index) => (
            <Fragment key={setting.label}>
              {index > 0 && <SectionSeparator className="my-4" />}
              <div className={setting.type === 'toggle' ? preferenceRowClassName : sliderRowClassName}>
                <span className={preferenceLabelClassName}>{setting.label}</span>
                {setting.type === 'toggle' ? (
                  <CompactChoiceGroup
                    className="justify-self-end"
                    ariaLabel={setting.label}
                    options={visibilityOptions}
                    value={setting.value ? 'enabled' : 'disabled'}
                    onChange={(value) => setting.onChange(value === 'enabled')}
                  />
                ) : (
                  <RangeSlider
                    ariaLabel={setting.label}
                    valueText={setting.labels[setting.value]}
                    markers={setting.labels}
                    min={0}
                    max={3}
                    step={1}
                    value={setting.value}
                    onChange={setting.onChange}
                    className="w-[80%] justify-self-end"
                  />
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
