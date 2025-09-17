import React from 'react';
import { View } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMultiScreen, useMultiScreenContext } from '@/components/ui/multi-screen';
import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowLeft, X as CloseIcon } from 'lucide-react-native';
import { AssetListRoute } from './routes/AssetListRoute';

export interface AssetSelectorPayload {
  isMulti?: boolean;
  selectedAssets?: string[];
  onSelect?: (assetIds: string[]) => void;
  onCancel?: () => void;
  onDelete?: (assetId: string) => void;
}

export interface AssetSelectorRouteContext {
  isMulti: boolean;
  selectedAssets: string[];
  setSelectedAssets: (assets: string[]) => void;
  toggleAssetSelection: (assetId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDelete?: (assetId: string) => void;
  payload?: AssetSelectorPayload;
}

// Create a context to hold the payload
const PayloadContext = React.createContext<AssetSelectorPayload | undefined>(undefined);

// Navigation Header Component
interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ title, subtitle, onClose }) => {
  const { router } = useMultiScreenContext();
  const canGoBack = router.canGoBack;

  return (
    <View className="px-4 py-3 border-b border-gray-200 bg-white">
      <HStack className="items-center justify-between">
        {/* Left side - Back button or empty space */}
        <View className="w-10">
          {canGoBack && (
            <Button variant="link" size="sm" onPress={() => router.goBack()} className="p-0">
              <Icon as={ArrowLeft} className="text-gray-700" size="md" />
            </Button>
          )}
        </View>

        {/* Center - Title */}
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          {subtitle && <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>}
        </View>

        {/* Right side - Close button */}
        <View className="w-10">
          <Button variant="link" size="sm" onPress={onClose} className="p-0">
            <Icon as={CloseIcon} className="text-gray-700" size="md" />
          </Button>
        </View>
      </HStack>
    </View>
  );
};

// Screen wrapper components
const ListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();
  const payload = React.useContext(PayloadContext);
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>(
    payload?.selectedAssets || [],
  );
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetSelectedAssets = React.useCallback(
    (assets: string[] | ((prev: string[]) => string[])) => {
      if (isMountedRef.current) {
        setSelectedAssets(assets);
      }
    },
    [],
  );

  const routeContext = React.useMemo<AssetSelectorRouteContext>(
    () => ({
      isMulti: payload?.isMulti || false,
      selectedAssets,
      setSelectedAssets: safeSetSelectedAssets,
      toggleAssetSelection: (assetId: string) => {
        if (!isMountedRef.current) return;

        if (payload?.isMulti) {
          safeSetSelectedAssets((prev) =>
            prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId],
          );
        } else {
          // For single selection, call onSelect directly without updating state
          // This prevents state updates after unmounting
          if (isMountedRef.current) {
            payload?.onSelect?.([assetId]);
            SheetManager.hide('asset-selector');
          }
        }
      },
      onConfirm: () => {
        if (selectedAssets.length > 0) {
          // Confirm selection for both single and multi mode
          payload?.onSelect?.(selectedAssets);
          SheetManager.hide('asset-selector');
        }
      },
      onCancel: () => {
        payload?.onCancel?.();
        SheetManager.hide('asset-selector');
      },
      onDelete: payload?.onDelete,
      payload,
    }),
    [selectedAssets, payload, router, safeSetSelectedAssets],
  );

  return (
    <>
      <NavigationHeader
        title={payload?.isMulti ? 'Seleccionar Archivos' : 'Seleccionar Archivo'}
        subtitle={
          selectedAssets.length > 0
            ? `${selectedAssets.length} seleccionado${selectedAssets.length !== 1 ? 's' : ''}`
            : undefined
        }
        onClose={routeContext.onCancel}
      />
      <AssetListRoute route={{ params: routeContext }} />
    </>
  );
};

// Create MultiScreen flow using builder
const assetSelectorFlow = createMultiScreen()
  .addStep('list', ListScreen)
  .build();

const { Component } = assetSelectorFlow;
// Main Sheet Component
interface AssetSelectorSheetProps extends SheetProps {
  payload?: AssetSelectorPayload;
}

function AssetSelectorSheet(props: AssetSelectorSheetProps) {
  const { payload } = props;

  const insets = useSafeAreaInsets();

  return (
    <BottomSheetWrapper
      sheetId="asset-selector"
      snapPoints={['95%']}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      handleIndicatorStyle={{
        backgroundColor: '#D1D5DB',
        width: 150,
        height: 4,
      }}
    >
      <View
        style={{
          height: '100%',
          paddingBottom: insets.bottom || 20,
        }}
      >
        <PayloadContext.Provider value={payload}>
          <Component />
        </PayloadContext.Provider>
      </View>
    </BottomSheetWrapper>
  );
}

export default AssetSelectorSheet;
