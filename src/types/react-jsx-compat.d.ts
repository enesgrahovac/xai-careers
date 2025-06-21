/// <reference types="react" />

// Map React 19's scoped JSX types to the old global JSX namespace so
// legacy type declarations (e.g. react-markdown) that still reference
// `JSX.*` continue to compile.  Remove this file once those dependencies
// migrate to `React.JSX`.

import * as React from "react";
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

        // Extend the intrinsic element map so libraries (e.g. react-markdown)
        // recognize <joblistingcard> as a valid tag.
        // We keep the same attribute shape as a generic <div> element.
        interface IntrinsicElements extends ReactJSX.IntrinsicElements {
            // Props accepted by the <joblistingcard /> custom element rendered by the LLM.
            joblistingcard: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                id?: string;
                title?: string;
                locations?: string;
                department?: string;
                payrange?: string;
                summary?: string;
            };
        }
    }
}

export { }; 