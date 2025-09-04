import React from 'react';
import { View } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react-native';
import type { PaginationState } from './usePagination';

/**
 * Props for PaginationControls component
 */
export interface PaginationControlsProps {
  state: PaginationState;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage: (page: number) => void;
  pageNumbers?: number[];
  isFetching?: boolean;
  variant?: 'simple' | 'full' | 'compact';
  showInfo?: boolean;
  className?: string;
}

/**
 * Reusable pagination controls component
 */
export function PaginationControls({
  state,
  onNextPage,
  onPreviousPage,
  onGoToPage,
  pageNumbers = [],
  isFetching = false,
  variant = 'simple',
  showInfo = true,
  className = '',
}: PaginationControlsProps) {
  if (variant === 'compact') {
    return (
      <HStack className={`items-center justify-between ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onPress={onPreviousPage}
          disabled={!state.hasPreviousPage || isFetching}
          className="border-gray-300"
        >
          <Icon as={ChevronLeftIcon} className="w-4 h-4" />
        </Button>

        <Text className="text-sm text-gray-600">
          {state.page} / {state.totalPages}
        </Text>

        <Button
          variant="outline"
          size="sm"
          onPress={onNextPage}
          disabled={!state.hasNextPage || isFetching}
          className="border-gray-300"
        >
          <Icon as={ChevronRightIcon} className="w-4 h-4" />
        </Button>
      </HStack>
    );
  }

  if (variant === 'full') {
    return (
      <VStack space="md" className={className}>
        {showInfo && (
          <HStack className="justify-between items-center">
            <Text className="text-sm text-gray-600">
              Mostrando {((state.page - 1) * state.limit) + 1}-{Math.min(state.page * state.limit, state.total)} de {state.total}
            </Text>
            {isFetching && (
              <HStack space="xs" className="items-center">
                <Spinner size="small" />
                <Text className="text-sm text-gray-500">Cargando...</Text>
              </HStack>
            )}
          </HStack>
        )}

        <HStack className="items-center justify-center" space="xs">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => onGoToPage(1)}
            disabled={state.page === 1 || isFetching}
            className="border-gray-300"
          >
            <Icon as={ChevronsLeftIcon} className="w-4 h-4" />
          </Button>

          {/* Previous page button */}
          <Button
            variant="outline"
            size="sm"
            onPress={onPreviousPage}
            disabled={!state.hasPreviousPage || isFetching}
            className="border-gray-300"
          >
            <Icon as={ChevronLeftIcon} className="w-4 h-4" />
          </Button>

          {/* Page numbers */}
          {pageNumbers.map((pageNum) => (
            <Pressable
              key={pageNum}
              onPress={() => onGoToPage(pageNum)}
              disabled={isFetching}
              className={`px-3 py-1.5 rounded-md border ${
                pageNum === state.page
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  pageNum === state.page ? 'text-white' : 'text-gray-700'
                }`}
              >
                {pageNum}
              </Text>
            </Pressable>
          ))}

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            onPress={onNextPage}
            disabled={!state.hasNextPage || isFetching}
            className="border-gray-300"
          >
            <Icon as={ChevronRightIcon} className="w-4 h-4" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => onGoToPage(state.totalPages)}
            disabled={state.page === state.totalPages || isFetching}
            className="border-gray-300"
          >
            <Icon as={ChevronsRightIcon} className="w-4 h-4" />
          </Button>
        </HStack>
      </VStack>
    );
  }

  // Simple variant (default)
  return (
    <HStack className={`items-center justify-between ${className}`}>
      {showInfo && (
        <Text className="text-sm text-gray-600">
          Página {state.page} de {state.totalPages}
        </Text>
      )}

      <HStack space="sm" className="items-center">
        <Button
          variant="outline"
          size="sm"
          onPress={onPreviousPage}
          disabled={!state.hasPreviousPage || isFetching}
          className="border-gray-300"
        >
          <Icon as={ChevronLeftIcon} className="w-4 h-4 mr-1" />
          <ButtonText>Anterior</ButtonText>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onPress={onNextPage}
          disabled={!state.hasNextPage || isFetching}
          className="border-gray-300"
        >
          <ButtonText>Siguiente</ButtonText>
          <Icon as={ChevronRightIcon} className="w-4 h-4 ml-1" />
        </Button>
      </HStack>
    </HStack>
  );
}