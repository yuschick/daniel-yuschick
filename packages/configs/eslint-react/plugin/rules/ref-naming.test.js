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
      code: 'const myRef = React.useRef(null);',
      errors: [{ messageId: 'internalRef', data: { name: 'myRef' } }],
    },
  ],
});
