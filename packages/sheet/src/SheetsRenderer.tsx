import React from 'react';
import { SheetManager } from './SheetManager';

/**
 * Component that renders all registered sheets
 * This component should be placed once in the app tree
 */
export function SheetsRenderer() {
  const [registeredSheets, setRegisteredSheets] = React.useState<Array<{ id: string; Component: React.ComponentType<any> }>>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    // Get all registered sheets from SheetManager
    setRegisteredSheets(SheetManager.getAllRegisteredSheets());
  }, []);

  // Subscribe to props changes to re-render components with updated props
  React.useEffect(() => {
    const unsubscribe = SheetManager.addListener(forceUpdate);
    return unsubscribe as any;
  }, []);


  return (
    <>
      {registeredSheets.map(({ id, Component }) => {
        const props = SheetManager.getProps(id);
        return <Component key={id} {...props} />;
      })}
    </>
  );
}