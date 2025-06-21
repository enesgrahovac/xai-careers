// Map React 19's scoped JSX types to the old global JSX namespace so
// legacy type declarations (e.g. react-markdown) that still reference
// `JSX.*` continue to compile.  Remove this file once those dependencies
// migrate to `React.JSX`.

import type { JSX as ReactJSX } from "react";

declare global {
    // Re-export all key sub-types under the global `JSX` namespace.
    namespace JSX {
        export type Element = ReactJSX.Element;
        export type ElementClass = ReactJSX.ElementClass;
        export type ElementAttributesProperty = ReactJSX.ElementAttributesProperty;
        export type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute;
        export type LibraryManagedAttributes<T, P> = ReactJSX.LibraryManagedAttributes<T, P>;
        export type IntrinsicAttributes = ReactJSX.IntrinsicAttributes;
        export type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>;
        export type IntrinsicElements = ReactJSX.IntrinsicElements;
    }
}

export { }; 