export default function Page({
  title,
  description,
  actions,
  children,
  eyebrow = "Your career workspace",
}) {
  return (
    <>
      <header className="c-page-heading">
        <div>
          <p className="c-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="c-description">{description}</p>}
        </div>
        {actions && <div className="c-actions">{actions}</div>}
      </header>
      <div className="c-stack">{children}</div>
    </>
  );
}
