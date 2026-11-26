import type { AnchorHTMLAttributes, ReactNode } from "react";

/** Stub de next/link para os testes de componente (sem o runtime do Next). */
export default function Link({
  href,
  children,
  ...rest
}: { href: string | { pathname?: string }; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={typeof href === "string" ? href : href.pathname} {...rest}>
      {children}
    </a>
  );
}
