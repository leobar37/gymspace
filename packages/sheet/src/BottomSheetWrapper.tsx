import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, type ComponentProps } from 'react';
import { SheetManager } from './SheetManager';
import type { BottomSheetWrapperProps } from './types';

// Constants for default configurations
const DEFAULT_SNAP_POINTS = ['50%', '90%'];
const BACKDROP_DEFAULT_DISAPPEARS = -1;
const BACKDROP_DEFAULT_APPEARS = 0;
const DEFAULT_PADDING_BOTTOM = 20;

// Exportable backdrop renderer function
export const renderBackdrop = (
  backdropComponent?: React.ComponentType<ComponentProps<typeof BottomSheetBackdrop>>,
) => {
  return (props: ComponentProps<typeof BottomSheetBackdrop>) =>
    backdropComponent ? (
      React.createElement(backdropComponent, props)
    ) : (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={BACKDROP_DEFAULT_DISAPPEARS}
        appearsOnIndex={BACKDROP_DEFAULT_APPEARS}
      />
    );
};

export const BottomSheetWrapper = React.memo<BottomSheetWrapperProps>(
  ({
    children,
    scrollable = false,
    sheetId,
    onShow,
    onHide,
    snapPoints: propSnapPoints,
    index = 0,
    enablePanDownToClose = true,
    enableDynamicSizing = false,
    onChange,
    onDismiss,
    backdropComponent,
    handleComponent,
    footerComponent,
    ...restProps
  }: BottomSheetWrapperProps) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Default snap points if not provided
    const snapPoints = useMemo(() => {
      if (propSnapPoints) return propSnapPoints;
      // When using dynamic sizing, still need snap points
      // but they will be adjusted based on content height
      return DEFAULT_SNAP_POINTS;
    }, [propSnapPoints]);

    // Register ref with SheetManager if sheetId is provided
    useEffect(() => {
      if (sheetId) {
        // Register the ref immediately, even if current is null
        // The ref will be updated when the component mounts

        SheetManager.setRef(sheetId, bottomSheetRef as any);

        // Clean up ref on unmount to prevent memory leak
        return () => {
          isUnmountingRef.current = true;
          SheetManager.setRef(sheetId, { current: null } as any);
          SheetManager.clearProps(sheetId);
        };
      }
    }, [sheetId]);

    // Track if sheet was shown to prevent duplicate onShow calls
    const wasShownRef = useRef(false);
    const isUnmountingRef = useRef(false);

    // Clean up on unmount
    useEffect(() => {
      return () => {
        isUnmountingRef.current = true;
        wasShownRef.current = false;
      };
    }, []);

    // Handle callbacks
    const handleSheetChanges = useCallback(
      (index: number, position: number, type: any) => {
        // Don't process callbacks if component is unmounting
        if (isUnmountingRef.current) return;

        // Pass all parameters to onChange if provided
        onChange?.(index, position, type);

        if (index === -1) {
          onHide?.();
          wasShownRef.current = false;
        } else if (index >= 0 && !wasShownRef.current && onShow) {
          // Only call onShow when sheet is first shown
          onShow();
          wasShownRef.current = true;
        }
      },
      [onChange, onHide, onShow],
    );

    const handleDismiss = useCallback(() => {
      // Reset shown state on dismiss
      wasShownRef.current = false;

      onDismiss?.();
      onHide?.();

      if (sheetId && !isUnmountingRef.current) {
        SheetManager.clearProps(sheetId);
      }
    }, [onDismiss, onHide, sheetId]);

    // Get props from SheetManager if available
    const sheetProps = sheetId ? SheetManager.getProps(sheetId) : undefined;

    // Auto-present if sheetId is provided and props are available
    useEffect(() => {
      if (
        sheetId &&
        sheetProps !== undefined &&
        bottomSheetRef.current &&
        !isUnmountingRef.current
      ) {
        // Use requestAnimationFrame for better performance than setTimeout
        const frameId = requestAnimationFrame(() => {
          if (bottomSheetRef.current && !isUnmountingRef.current) {
            bottomSheetRef.current.present();
          }
        });

        return () => {
          cancelAnimationFrame(frameId);
        };
      }
    }, [sheetId, sheetProps]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={index}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        onChange={handleSheetChanges}
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop(backdropComponent)}
        handleComponent={handleComponent}
        footerComponent={footerComponent}
        {...restProps}
      >
        {scrollable ? (
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: DEFAULT_PADDING_BOTTOM }}>
            {typeof children === 'function' && sheetProps ? children(sheetProps) : children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView>
            {typeof children === 'function' && sheetProps ? children(sheetProps) : children}
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

BottomSheetWrapper.displayName = 'BottomSheetWrapper';
