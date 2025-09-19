import React from 'react';
import { SheetManager } from './SheetManager';

/**
 * Component that renders all registered sheets
 * This component should be placed once in the app tree
 */
export function SheetsRenderer() {
  const [registeredSheets, setRegisteredSheets] = React.useState<Array<{ id: string; Component: React.ComponentType<any> }>>([]);

  React.useEffect(() => {
    // Get all registered sheets from SheetManager
    setRegisteredSheets(SheetManager.getAllRegisteredSheets());
  }, []);

  return (
    <>
      {registeredSheets.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}