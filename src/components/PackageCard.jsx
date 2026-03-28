import './PackageCard.css';

export default function PackageCard({ pkg, currency, selected, onSelect }) {
  return (
    <button
      className={`package-card ${selected ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
      onClick={() => onSelect(pkg)}
      id={`package-${pkg.id}`}
    >
      {pkg.popular && <span className="popular-badge">Popular</span>}
      <span className="package-amount">{pkg.amount.toLocaleString()}</span>
      <span className="package-currency">{currency}</span>
      <span className="package-price">${pkg.price.toFixed(2)}</span>
    </button>
  );
}
