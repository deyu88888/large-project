// This file provides global JSX namespace declarations
import React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any, any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Make this file a module
export {};