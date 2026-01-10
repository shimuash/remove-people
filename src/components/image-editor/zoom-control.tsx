'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEditorStoreSelector } from './hooks/use-editor-state';

export default function ZoomControl() {
  const t = useTranslations('ImageEditor');

  const { zoomLevel, zoomIn, zoomOut, zoomToActual, zoomToFit, isCompareMode } =
    useEditorStoreSelector((s) => ({
      zoomLevel: s.zoomLevel,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
      zoomToActual: s.zoomToActual,
      zoomToFit: s.zoomToFit,
      isCompareMode: s.isCompareMode,
    }));

  const zoomPercent = Math.round(zoomLevel * 100);

  if (isCompareMode) {
    return null;
  }

  return (
    <div className="flex items-center bg-background rounded-lg shadow-lg overflow-hidden">
      {/* Zoom Out Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-none cursor-pointer"
        onClick={zoomOut}
      >
        <Minus className="size-4" />
      </Button>

      {/* Center: Zoom Percentage with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none px-2 min-w-14 tabular-nums cursor-pointer focus-visible:ring-0"
          >
            {zoomPercent}%
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" sideOffset={8} className="min-w-24">
          <DropdownMenuItem onClick={zoomToActual}>
            {t('zoom.zoomTo100')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={zoomToFit}>
            {t('zoom.zoomToFit')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom In Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-none cursor-pointer"
        onClick={zoomIn}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
