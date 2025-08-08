/**
 * Example usage of the AssetSelector component
 * This file demonstrates how to integrate the AssetSelector with forms
 */

import React from 'react';
import { View } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { AssetSelector } from './components/AssetSelector';
import { Button, ButtonText } from '@/components/ui/button';

interface ProductFormData {
  name: string;
  description: string;
  // Single asset
  thumbnail: {
    asset: string | null;
  };
  // Multiple assets
  images: {
    assets: string[];
  };
}

export function ExampleProductForm() {
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      thumbnail: {
        asset: null,
      },
      images: {
        assets: [],
      },
    },
  });

  const onSubmit = (data: ProductFormData) => {
    console.log('Form Data:', data);
    // data.thumbnail.asset will contain a single asset ID or null
    // data.images.assets will contain an array of asset IDs
  };

  return (
    <FormProvider {...form}>
      <View className="p-4">
        {/* Single Asset Selection */}
        <AssetSelector
          name="thumbnail"
          label="Product Thumbnail"
          multi={false}
          required
        />

        {/* Multiple Assets Selection */}
        <AssetSelector
          name="images"
          label="Product Images"
          multi={true}
        />

        <Button onPress={form.handleSubmit(onSubmit)} className="mt-4">
          <ButtonText>Submit</ButtonText>
        </Button>
      </View>
    </FormProvider>
  );
}

// Example for Category Form
interface CategoryFormData {
  name: string;
  icon: {
    asset: string | null;
  };
}

export function ExampleCategoryForm() {
  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      icon: {
        asset: null,
      },
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    console.log('Category Data:', data);
    // data.icon.asset will contain the asset ID
  };

  return (
    <FormProvider {...form}>
      <View className="p-4">
        <AssetSelector
          name="icon"
          label="Category Icon"
          multi={false}
          required
        />

        <Button onPress={form.handleSubmit(onSubmit)} className="mt-4">
          <ButtonText>Save Category</ButtonText>
        </Button>
      </View>
    </FormProvider>
  );
}

// Example for Plan Form with multiple images
interface PlanFormData {
  name: string;
  price: number;
  gallery: {
    assets: string[];
  };
}

export function ExamplePlanForm() {
  const form = useForm<PlanFormData>({
    defaultValues: {
      name: '',
      price: 0,
      gallery: {
        assets: [],
      },
    },
  });

  const onSubmit = (data: PlanFormData) => {
    console.log('Plan Data:', data);
    // data.gallery.assets will contain an array of asset IDs
  };

  return (
    <FormProvider {...form}>
      <View className="p-4">
        <AssetSelector
          name="gallery"
          label="Plan Gallery Images"
          multi={true}
        />

        <Button onPress={form.handleSubmit(onSubmit)} className="mt-4">
          <ButtonText>Save Plan</ButtonText>
        </Button>
      </View>
    </FormProvider>
  );
}