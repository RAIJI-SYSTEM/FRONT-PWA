/** Stub de next/image: usa <img> simples (sem otimização). */
export default function Image({ src, alt, fill, priority, ...rest }: Record<string, unknown>) {
  void fill;
  void priority;
  return <img src={String(src)} alt={String(alt ?? "")} {...(rest as Record<string, string>)} />;
}
