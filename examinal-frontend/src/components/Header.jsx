export default function Header({ title, subtitle, actions, children }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
