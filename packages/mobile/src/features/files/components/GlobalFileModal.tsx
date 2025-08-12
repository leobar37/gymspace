import React from 'react';
import { FileModal } from './FileModal';

/**
 * Global file modal that should be included at the root of the app
 * This allows any component to open the file selection modal
 */
export function GlobalFileModal() {
  return <FileModal />;
}