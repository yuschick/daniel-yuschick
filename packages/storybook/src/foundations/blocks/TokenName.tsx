import styles from './blocks.module.css';

export interface TokenNameProps {
  /** The CSS custom property name without its leading `--`. */
  name: string;
}

/** A token's CSS custom property, as it's written in CSS. */
export const TokenName = function TokenName({ name }: TokenNameProps) {
  return <code className={styles.name}>--{name}</code>;
};
