'use client';

import { H4 } from '@expo/html-elements';
import { createActionsheet } from '@gluestack-ui/actionsheet';
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
import { PrimitiveIcon, UIIcon } from '@gluestack-ui/icon';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import { cssInterop } from 'nativewind';
import {
  Motion,
  AnimatePresence,
  createMotionAnimatedComponent,
  MotionComponentProps,
} from '@legendapp/motion';

import React from 'react';

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
  DragIndicatorWrapper: View,
  Backdrop: AnimatedPressable,
  ScrollView: ScrollView,
  VirtualizedList: VirtualizedList,
  FlatList: FlatList,
  SectionList: SectionList,
  SectionHeaderText: H4,
  Icon: UIIcon,
});

const actionsheetStyle = tva({ base: 'w-full h-full web:pointer-events-none' });

const actionsheetBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default web:pointer-events-auto',
});

const actionsheetContentStyle = tva({
  base: 'items-center rounded-tl-3xl rounded-tr-3xl p-5 pt-2 bg-background-0 web:pointer-events-auto web:select-none shadow-hard-5 border border-b-0 border-outline-100',
});

const actionsheetDragIndicatorWrapperStyle = tva({
  base: 'w-full py-1 items-center',
});

const actionsheetDragIndicatorStyle = tva({
  base: 'w-16 h-1 bg-background-400 rounded-full',
});

const actionsheetItemStyle = tva({
  base: 'w-full flex-row items-center p-3 rounded-sm data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-auto data-[disabled=true]:web:cursor-not-allowed hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 web:data-[focus-visible=true]:bg-background-100 web:data-[focus-visible=true]:outline-indicator-primary gap-2',
});

const actionsheetItemTextStyle = tva({
  base: 'text-typography-700 font-normal font-body',
  variants: {
    isTruncated: {
      true: '',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    size: {
      '2xs': 'text-2xs',
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
  },
});

const actionsheetIconStyle = tva({
  base: 'text-background-500 fill-none',
  variants: {
    size: {
      '2xs': 'h-3 w-3',
      xs: 'h-3.5 w-3.5',
      sm: 'h-4 w-4',
      md: 'w-[18px] h-[18px]',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    },
  },
});

const actionsheetScrollViewStyle = tva({
  base: 'w-full h-auto',
});

const actionsheetVirtualizedListStyle = tva({
  base: 'w-full h-auto',
});

const actionsheetFlatListStyle = tva({
  base: 'w-full h-auto',
});

const actionsheetSectionListStyle = tva({
  base: 'w-full h-auto',
});

const actionsheetSectionHeaderTextStyle = tva({
  base: 'leading-5 font-bold font-heading my-0 text-typography-500 p-3 uppercase',
  variants: {
    isTruncated: {
      true: '',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    size: {
      '5xl': 'text-5xl',
      '4xl': 'text-4xl',
      '3xl': 'text-3xl',
      '2xl': 'text-2xl',
      xl: 'text-xl',
      lg: 'text-lg',
      md: 'text-base',
      sm: 'text-sm',
      xs: 'text-xs',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow500',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
});

type IActionsheetProps = VariantProps<typeof actionsheetStyle> &
  React.ComponentProps<typeof UIActionsheet>;

export const Actionsheet = React.forwardRef(
  ({ className, ...props }: IActionsheetProps, ref?: any) => {
    return (
      <UIActionsheet
        className={actionsheetStyle({ class: className })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetBackdropProps = VariantProps<typeof actionsheetBackdropStyle> &
  React.ComponentProps<typeof UIActionsheet.Backdrop>;

export const ActionsheetBackdrop = React.forwardRef(
  ({ className, ...props }: IActionsheetBackdropProps, ref?: any) => {
    return (
      <UIActionsheet.Backdrop
        className={actionsheetBackdropStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetContentProps = VariantProps<typeof actionsheetContentStyle> &
  React.ComponentProps<typeof UIActionsheet.Content>;

export const ActionsheetContent = React.forwardRef(
  ({ className, ...props }: IActionsheetContentProps, ref?: any) => {
    return (
      <UIActionsheet.Content
        className={actionsheetContentStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetDragIndicatorWrapperProps = VariantProps<
  typeof actionsheetDragIndicatorWrapperStyle
> &
  React.ComponentProps<typeof UIActionsheet.DragIndicatorWrapper>;

export const ActionsheetDragIndicatorWrapper = React.forwardRef(
  ({ className, ...props }: IActionsheetDragIndicatorWrapperProps, ref?: any) => {
    return (
      <UIActionsheet.DragIndicatorWrapper
        className={actionsheetDragIndicatorWrapperStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetDragIndicatorProps = VariantProps<
  typeof actionsheetDragIndicatorStyle
> &
  React.ComponentProps<typeof UIActionsheet.DragIndicator>;

export const ActionsheetDragIndicator = React.forwardRef(
  ({ className, ...props }: IActionsheetDragIndicatorProps, ref?: any) => {
    return (
      <UIActionsheet.DragIndicator
        className={actionsheetDragIndicatorStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetItemProps = VariantProps<typeof actionsheetItemStyle> &
  React.ComponentProps<typeof UIActionsheet.Item>;

export const ActionsheetItem = React.forwardRef(
  ({ className, ...props }: IActionsheetItemProps, ref?: any) => {
    return (
      <UIActionsheet.Item
        className={actionsheetItemStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetItemTextProps = VariantProps<typeof actionsheetItemTextStyle> &
  React.ComponentProps<typeof UIActionsheet.ItemText>;

export const ActionsheetItemText = React.forwardRef(
  ({ className, size = 'md', ...props }: IActionsheetItemTextProps, ref?: any) => {
    return (
      <UIActionsheet.ItemText
        className={actionsheetItemTextStyle({
          size,
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetIconProps = VariantProps<typeof actionsheetIconStyle> &
  React.ComponentProps<typeof UIActionsheet.Icon>;

export const ActionsheetIcon = React.forwardRef(
  ({ className, size = 'md', ...props }: IActionsheetIconProps, ref?: any) => {
    return (
      <UIActionsheet.Icon
        className={actionsheetIconStyle({
          size,
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetScrollViewProps = VariantProps<typeof actionsheetScrollViewStyle> &
  React.ComponentProps<typeof UIActionsheet.ScrollView>;

export const ActionsheetScrollView = React.forwardRef(
  ({ className, ...props }: IActionsheetScrollViewProps, ref?: any) => {
    return (
      <UIActionsheet.ScrollView
        className={actionsheetScrollViewStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetVirtualizedListProps = VariantProps<
  typeof actionsheetVirtualizedListStyle
> &
  React.ComponentProps<typeof UIActionsheet.VirtualizedList>;

export const ActionsheetVirtualizedList = React.forwardRef(
  ({ className, ...props }: IActionsheetVirtualizedListProps, ref?: any) => {
    return (
      <UIActionsheet.VirtualizedList
        className={actionsheetVirtualizedListStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetFlatListProps = VariantProps<typeof actionsheetFlatListStyle> &
  React.ComponentProps<typeof UIActionsheet.FlatList>;

export const ActionsheetFlatList = React.forwardRef(
  ({ className, ...props }: IActionsheetFlatListProps, ref?: any) => {
    return (
      <UIActionsheet.FlatList
        className={actionsheetFlatListStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetSectionListProps = VariantProps<typeof actionsheetSectionListStyle> &
  React.ComponentProps<typeof UIActionsheet.SectionList>;

export const ActionsheetSectionList = React.forwardRef(
  ({ className, ...props }: IActionsheetSectionListProps, ref?: any) => {
    return (
      <UIActionsheet.SectionList
        className={actionsheetSectionListStyle({
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

type IActionsheetSectionHeaderTextProps = VariantProps<
  typeof actionsheetSectionHeaderTextStyle
> &
  React.ComponentProps<typeof UIActionsheet.SectionHeaderText>;

export const ActionsheetSectionHeaderText = React.forwardRef(
  ({ className, size = 'xs', ...props }: IActionsheetSectionHeaderTextProps, ref?: any) => {
    return (
      <UIActionsheet.SectionHeaderText
        className={actionsheetSectionHeaderTextStyle({
          size,
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);