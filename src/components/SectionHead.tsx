interface Props {
  id: string;
  title: string;
  sub?: string;
}

export function SectionHead({ id, title, sub }: Props) {
  return (
    <header className="section-head">
      <h2 id={id}>{title}</h2>
      {sub && <p className="section-head__sub">{sub}</p>}
    </header>
  );
}
