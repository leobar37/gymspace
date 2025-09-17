'use client';
import React from 'react';
import { createActionsheet } from '@gluestack-ui/actionsheet';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import {
  Pressable,
  View,
  Text,
  ScrollView,
  VirtualizedList,
  FlatList,
  SectionList,
  ViewStyle,
} from 'react-native';
import { UIIcon } from '@gluestack-ui/icon';
import {
  Motion,
  AnimatePresence,
  createMotionAnimatedComponent,
  MotionComponentProps,
} from '@legendapp/motion';

type IAnimatedPressableProps = React.ComponentProps<typeof Pressable> &
  MotionComponentProps<typeof Pressable, ViewStyle, unknown, unknown, unknown>;

const AnimatedPressable = createMotionAnimatedComponent(
  Pressable
) as React.ComponentType<IAnimatedPressableProps>;

type IMotionViewProps = React.ComponentProps<typeof View> &
  MotionComponentProps<typeof View, ViewStyle, unknown, unknown, unknown>;

const MotionView = Motion.View as React.ComponentType<IMotionViewProps>;

export const UIActionsheet = createActionsheet({
  Root: View,
  Content: withStyleContext(MotionView),
  Item: withStyleContext(Pressable),
  ItemText: Text,
  DragIndicator: View,
  IndicatorWrapper: View,
  Backdrop: AnimatedPressable,
  ScrollView: ScrollView,
  VirtualizedList: VirtualizedList,
  FlatList: FlatList,
  SectionList: SectionList,
  SectionHeaderText: Text,
  Icon: UIIcon,
  AnimatePresence: AnimatePresence,
});

// CSS interop configurations removed due to type conflicts

const actionsheetStyle = tva({
  base: 'w-full h-full web:pointer-events-none'
});

const actionsheetContentStyle = tva({
  base: 'items-center rounded-tl-3xl rounded-tr-3xl p-5 pt-2 bg-background-0 web:pointer-events-auto web:select-none shadow-hard-5 border border-b-0 border-outline-100',
});

const actionsheetItemStyle = tva({
  base: 'w-full flex-row items-center p-3 rounded-sm data-[disabled=true]:opacity-40 hover:bg-background-50 active:bg-background-100 gap-2',
});

const actionsheetItemTextStyle = tva({
  base: 'text-typography-700 font-normal font-body',
  variants: {
    size: {
      '2xs': 'text-2xs',
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
    },
  },
});

const actionsheetDragIndicatorStyle = tva({
  base: 'w-16 h-1 bg-background-400 rounded-full',
});

const actionsheetDragIndicatorWrapperStyle = tva({
  base: 'w-full py-1 items-center',
});

const actionsheetBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default',
});

const actionsheetIconStyle = tva({
  base: 'text-background-500 fill-none',
  variants: {
    size: {
      '2xs': 'h-3 w-3',
      'xs': 'h-3.5 w-3.5',
      'sm': 'h-4 w-4',
      'md': 'w-[18px] h-[18px]',
      'lg': 'h-5 w-5',
      'xl': 'h-6 w-6',
    },
  },
});

type IActionsheetProps = VariantProps<typeof actionsheetStyle> &
  React.ComponentProps<typeof UIActionsheet>;

const Actionsheet = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet>,
  IActionsheetProps
>(function Actionsheet(props, ref) {
  return (
    <UIActionsheet
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetContentProps = VariantProps<typeof actionsheetContentStyle> &
  React.ComponentProps<typeof UIActionsheet.Content>;

const ActionsheetContent = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Content>,
  IActionsheetContentProps
>(function ActionsheetContent(props, ref) {
  return (
    <UIActionsheet.Content
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetItemProps = VariantProps<typeof actionsheetItemStyle> &
  React.ComponentProps<typeof UIActionsheet.Item>;

const ActionsheetItem = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Item>,
  IActionsheetItemProps
>(function ActionsheetItem(props, ref) {
  return (
    <UIActionsheet.Item
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetItemTextProps = VariantProps<typeof actionsheetItemTextStyle> &
  React.ComponentProps<typeof UIActionsheet.ItemText>;

const ActionsheetItemText = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.ItemText>,
  IActionsheetItemTextProps
>(function ActionsheetItemText(props, ref) {
  return (
    <UIActionsheet.ItemText
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetDragIndicatorProps = VariantProps<typeof actionsheetDragIndicatorStyle> &
  React.ComponentProps<typeof UIActionsheet.DragIndicator>;

const ActionsheetDragIndicator = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.DragIndicator>,
  IActionsheetDragIndicatorProps
>(function ActionsheetDragIndicator(props, ref) {
  return (
    <UIActionsheet.DragIndicator
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetDragIndicatorWrapperProps = VariantProps<typeof actionsheetDragIndicatorWrapperStyle> &
  React.ComponentProps<typeof UIActionsheet.DragIndicatorWrapper>;

const ActionsheetDragIndicatorWrapper = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.DragIndicatorWrapper>,
  IActionsheetDragIndicatorWrapperProps
>(function ActionsheetDragIndicatorWrapper(props, ref) {
  return (
    <UIActionsheet.DragIndicatorWrapper
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetBackdropProps = VariantProps<typeof actionsheetBackdropStyle> &
  React.ComponentProps<typeof UIActionsheet.Backdrop>;

const ActionsheetBackdrop = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Backdrop>,
  IActionsheetBackdropProps
>(function ActionsheetBackdrop(props, ref) {
  return (
    <UIActionsheet.Backdrop
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetScrollView = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.ScrollView>,
  React.ComponentProps<typeof UIActionsheet.ScrollView>
>(function ActionsheetScrollView(props, ref) {
  return (
    <UIActionsheet.ScrollView
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetVirtualizedList = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.VirtualizedList>,
  React.ComponentProps<typeof UIActionsheet.VirtualizedList>
>(function ActionsheetVirtualizedList(props, ref) {
  return (
    <UIActionsheet.VirtualizedList
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetFlatList = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.FlatList>,
  React.ComponentProps<typeof UIActionsheet.FlatList>
>(function ActionsheetFlatList(props, ref) {
  return (
    <UIActionsheet.FlatList
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetSectionList = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.SectionList>,
  React.ComponentProps<typeof UIActionsheet.SectionList>
>(function ActionsheetSectionList(props, ref) {
  return (
    <UIActionsheet.SectionList
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetSectionHeaderText = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.SectionHeaderText>,
  React.ComponentProps<typeof UIActionsheet.SectionHeaderText>
>(function ActionsheetSectionHeaderText(props, ref) {
  return (
    <UIActionsheet.SectionHeaderText
      ref={ref}
      {...props}
    />
  );
});

type IActionsheetIconProps = VariantProps<typeof actionsheetIconStyle> &
  React.ComponentProps<typeof UIActionsheet.Icon> & {
    as?: React.ElementType;
  };

const ActionsheetIcon = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Icon>,
  IActionsheetIconProps
>(function ActionsheetIcon(props, ref) {
  return (
    <UIActionsheet.Icon
      ref={ref}
      {...props}
    />
  );
});

export {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
  ActionsheetScrollView,
  ActionsheetVirtualizedList,
  ActionsheetFlatList,
  ActionsheetSectionList,
  ActionsheetSectionHeaderText,
  ActionsheetIcon,
};