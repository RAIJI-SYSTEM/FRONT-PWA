import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  children: ReactNode;
};

/** Stub de next/link para os testes de componente (sem o runtime do Next). */
export default function Link({ href, children, ...rest }: LinkProps) {
  return (
    <a href={typeof href === "string" ? href : href.pathname} {...rest}>
      {children}
    </a>
  );
}
