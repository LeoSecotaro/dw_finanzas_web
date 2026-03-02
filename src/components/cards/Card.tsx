import React from 'react';
import type { ReactNode } from 'react';
import styles from './Card.module.css';

type CardProps = {
  title: string;
  color?: string; // background color
  icon?: ReactNode;
  onClick?: () => void;
};

export default function Card({ title, color = '#1677ff', icon, onClick }: CardProps) {
  const className = `${styles.cardTile} ${onClick ? '' : styles.noPointer}`;
  return (
    <div
      onClick={onClick}
      className={className}
      style={{ background: color }}
    >
      <div className={styles.iconWrap}>{icon}</div>
      <div className={styles.title}>{title}</div>
    </div>
  );
}
