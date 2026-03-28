import './PaymentMethodCard.css';

export default function PaymentMethodCard({ method, selected, onSelect }) {
  return (
    <button
      className={`payment-method-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(method)}
      id={`payment-${method.id}`}
    >
      <span className="payment-icon">
        {typeof method.icon === 'string' && method.icon.startsWith('/') ? (
          <img src={method.icon} alt={method.name} className="payment-icon-img" />
        ) : (
          method.icon
        )}
      </span>
      <div className="payment-info">
        <span className="payment-name">{method.name}</span>
        <span className="payment-desc">{method.description}</span>
      </div>
      <div className={`payment-radio ${selected ? 'checked' : ''}`}>
        <div className="payment-radio-dot"></div>
      </div>
    </button>
  );
}
