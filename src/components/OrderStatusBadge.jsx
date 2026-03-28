import './OrderStatusBadge.css';

const statusConfig = {
  pending: { label: 'Pending', className: 'badge-warning', icon: '⏳' },
  processing: { label: 'Processing', className: 'badge-info', icon: '⚙️' },
  success: { label: 'Success', className: 'badge-success', icon: '✅' },
  failed: { label: 'Failed', className: 'badge-error', icon: '❌' },
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`order-status-badge badge ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      {config.label}
    </span>
  );
}
