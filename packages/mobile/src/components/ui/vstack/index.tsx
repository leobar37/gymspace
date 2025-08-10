import React from 'react';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { View, Text } from 'react-native';

import { vstackStyle } from './styles';

type IVStackProps = React.ComponentProps<typeof View> &
  VariantProps<typeof vstackStyle>;

const VStack = React.forwardRef<React.ComponentRef<typeof View>, IVStackProps>(
  function VStack({ className, space, reversed, children, ...props }, ref) {
    // Temporary fix: wrap string children in Text component
    const processedChildren = React.Children.map(children, (child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return <Text>{child}</Text>;
      }
      return child;
    });

    return (
      <View
        className={vstackStyle({ space, reversed, class: className })}
        {...props}
        ref={ref}
      >
        {processedChildren}
      </View>
    );
  }
);

VStack.displayName = 'VStack';

export { VStack };
