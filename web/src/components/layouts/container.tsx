import type { ReactNode } from "react";

/**
 * 本文の幅。既定は読み物として無理なく読める幅にし、
 * 表やグラフを並べるページは wide で画面の広さを使う。
 */
const SIZE_CLASSES = {
  default: "max-w-4xl",
  wide: "max-w-7xl",
} as const;

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: keyof typeof SIZE_CLASSES;
}

export function Container({
  children,
  className = "",
  size = "default",
}: ContainerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
