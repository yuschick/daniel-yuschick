export type WithChildren<P = object> = P & {
  children: React.ReactNode | React.ReactNode[];
};

type ForbiddenAttributes = 'className' | 'style';

export type SanitizedHTMLAttributes<T, K extends keyof T = never> = Omit<
  T,
  K | (ForbiddenAttributes & keyof T)
>;

export type SanitizedSVGAttributes<T, K extends keyof T = never> = Omit<
  T,
  K | (ForbiddenAttributes & keyof T)
>;
