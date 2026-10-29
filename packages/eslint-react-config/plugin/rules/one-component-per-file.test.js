import { ruleTester } from '../rule-tester.js';
import { oneComponentPerFile } from './one-component-per-file.js';

ruleTester.run('one-component-per-file', oneComponentPerFile, {
  valid: [
    {
      name: 'a single component',
      code: `
        export const Dialog = function Dialog({ children }) {
          return <div>{children}</div>;
        };
      `,
    },
    {
      name: 'a component alongside its internal hook',
      code: `
        function useButton() {
          return { className: 'button' };
        }

        export const Button = function Button() {
          const buttonProps = useButton();
          return <button {...buttonProps} />;
        };
      `,
    },
    {
      name: 'a PascalCase function that renders no JSX is not a component',
      code: `
        function CreateStore() {
          return {};
        }

        export const Dialog = function Dialog() {
          return <div />;
        };
      `,
    },
    {
      name: 'JSX inside a callback belongs to its enclosing component',
      code: `
        export const List = function List({ items }) {
          return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
        };
      `,
    },
  ],
  invalid: [
    {
      name: 'two components in one file',
      code: `
        export function DialogHeader({ children }) {
          return <div>{children}</div>;
        }

        export function Dialog({ children }) {
          return <div>{children}</div>;
        }
      `,
      errors: [{ messageId: 'multipleComponents', data: { name: 'Dialog' } }],
    },
    {
      name: 'an arrow-function component counts too',
      code: `
        export const Dialog = function Dialog() {
          return <div />;
        };

        const DialogFooter = () => <></>;
      `,
      errors: [
        { messageId: 'multipleComponents', data: { name: 'DialogFooter' } },
      ],
    },
  ],
});
