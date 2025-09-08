import { useMemo, useState, useCallback } from 'react';

export interface UseDataSearchOptions<T> {
  data: T[] | undefined;
  searchFields: (item: T) => string[];
  searchPlaceholder?: string;
}

export interface UseDataSearchResult<T> {
  searchInput: string;
  setSearchInput: (value: string) => void;
  filteredData: T[];
  clearSearch: () => void;
  hasSearch: boolean;
  resultCount: number;
  searchPlaceholder: string;
}

/**
 * Hook for handling local data search with filtering
 * @param options Configuration for search behavior
 * @returns Search state and filtered results
 */
export function useDataSearch<T>({
  data,
  searchFields,
  searchPlaceholder = 'Buscar...',
}: UseDataSearchOptions<T>): UseDataSearchResult<T> {
  const [searchInput, setSearchInput] = useState('');

  // Filter data based on search input
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchInput.trim()) return data;

    const searchLower = searchInput.toLowerCase().trim();
    
    return data.filter((item) => {
      const fieldsToSearch = searchFields(item);
      return fieldsToSearch.some((field) => 
        field?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchInput, searchFields]);

  // Clear search input
  const clearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  // Check if search is active
  const hasSearch = useMemo(() => !!searchInput.trim(), [searchInput]);

  // Get result count
  const resultCount = useMemo(() => filteredData.length, [filteredData]);

  return {
    searchInput,
    setSearchInput,
    filteredData,
    clearSearch,
    hasSearch,
    resultCount,
    searchPlaceholder,
  };
}