import React from 'react';
import { PwaUpdateBanner } from './PwaUpdateBanner';
import { PwaInstallButton } from './PwaInstallButton';

export const PwaOverlays: React.FC = () => (
  <>
    <PwaUpdateBanner />
    <PwaInstallButton />
  </>
);