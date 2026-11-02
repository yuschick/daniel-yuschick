import { ruleTester } from '../rule-tester.js';
import { refNaming } from './ref-naming.js';

ruleTester.run('ref-naming', refNaming, {
  valid: [
    {
      name: 'ref destructured as externalRef, useRef named internalRef',
      code: `
        export const VisuallyHidden = function VisuallyHidden({
          ref: externalRef,
          children,
          ...htmlAttributes
        }: VisuallyHiddenProps) {
          const internalRef = React.useRef<HTMLDivElement>(null);
          return <div ref={externalRef} {...htmlAttributes}>{children}</div>;
        };
      `,
    },
    {
      name: 'descriptive internal ref name',
      code: 'const internalContainerRef = useRef(null);',
    },
    {
      name: 'a hook may name its refs anything that ends in Ref',
      code: `
        export function useScrollLock() {
          const hasLockRef = useRef(false);
          const callbackRef = React.useRef(null);
          return { hasLockRef, callbackRef };
        }
      `,
    },
    {
      name: 'a ref created in a callback inside a hook is judged as a hook ref',
      code: `
        export function useReturnFocus() {
          const handle = useCallback(() => {
            const triggerRef = useRef(null);
            return triggerRef;
          }, []);
          return handle;
        }
      `,
    },
    {
      name: 'a hook may use a ref prop under any name',
      code: 'function useThing({ ref }) { return ref; }',
    },
    {
      name: 'non-component functions are ignored',
      code: 'function buildProps({ ref }) { return ref; }',
    },
  ],
  invalid: [
    {
      name: 'ref prop left un-renamed',
      code: `
        export const VisuallyHidden = function VisuallyHidden({ ref, children }) {
          return <div ref={ref}>{children}</div>;
        };
      `,
      errors: [{ messageId: 'externalRef' }],
    },
    {
      name: 'ref prop renamed to a generic name',
      code: 'const Input = ({ ref: forwardedRef }) => <input ref={forwardedRef} />;',
      errors: [{ messageId: 'externalRef' }],
    },
    {
      name: 'ambiguous useRef name',
      code: `
        export const Panel = function Panel() {
          const myRef = React.useRef(null);
          return <div ref={myRef} />;
        };
      `,
      errors: [{ messageId: 'internalRef', data: { name: 'myRef' } }],
    },
    {
      name: 'a component must name internal refs internal*Ref even with a Ref suffix',
      code: `
        export const Panel = function Panel() {
          const triggerRef = useRef(null);
          return <div ref={triggerRef} />;
        };
      `,
      errors: [{ messageId: 'internalRef', data: { name: 'triggerRef' } }],
    },
    {
      name: 'a hook ref without the Ref suffix',
      code: 'function useScrollLock() { const hasLock = useRef(false); return hasLock; }',
      errors: [{ messageId: 'refSuffix', data: { name: 'hasLock' } }],
    },
    {
      name: 'a ref created outside any function needs the Ref suffix',
      code: 'const cache = useRef(null);',
      errors: [{ messageId: 'refSuffix', data: { name: 'cache' } }],
    },
  ],
});
