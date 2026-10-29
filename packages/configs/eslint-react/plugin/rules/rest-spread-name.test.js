import { ruleTester } from '../rule-tester.js';
import { restSpreadName } from './rest-spread-name.js';

ruleTester.run('rest-spread-name', restSpreadName, {
  valid: [
    {
      name: 'htmlAttributes',
      code: `
        export const Button = function Button({ size, ...htmlAttributes }: ButtonProps) {
          return <button {...htmlAttributes} />;
        };
      `,
    },
    {
      name: 'a component composing another DY component',
      code: `
        export const IconButton = function IconButton({ icon, ...buttonAndHTMLAttributes }) {
          return <Button {...buttonAndHTMLAttributes} />;
        };
      `,
    },
    {
      name: 'non-component functions are ignored',
      code: 'function omitSize({ size, ...rest }) { return rest; }',
    },
  ],
  invalid: [
    {
      name: '...rest',
      code: 'const Card = function Card({ title, ...rest }) { return <div {...rest} />; };',
      errors: [{ messageId: 'invalidName', data: { name: 'rest' } }],
    },
    {
      name: '...props',
      code: 'function Card({ title, ...props }) { return <div {...props} />; }',
      errors: [{ messageId: 'invalidName', data: { name: 'props' } }],
    },
  ],
});
