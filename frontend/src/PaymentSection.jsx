import { useState, useEffect } from 'react';
import StripePaymentForm from './StripePaymentForm';

export default function PaymentSection({ token, onClose }) {
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 9.99,
      features: [
        'Unlimited children accounts',
        'Extended daily limits (120 min/day)',
        'Priority support',
        'Basic analytics'
      ],
      color: '#b6e0fe'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 19.99,
      features: [
        'All Basic features',
        'Advanced analytics & reports',
        'Custom learning topics',
        '24/7 priority support',
        'Progress tracking',
        'Educational content library'
      ],
      color: '#ffe9b2',
      popular: true
    }
  ];

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/parent/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  const handlePaymentSuccess = (data) => {
    setMessage('Payment successful! Your subscription has been updated.');
    setSubscription({ subscription_status: data.subscription.plan });
    setSelectedPlan(null);
    // Close modal after successful payment
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };

  const handlePaymentError = (error) => {
    setMessage(`Payment failed: ${error}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'premium': return '#4caf50';
      case 'basic': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'premium': return 'Premium';
      case 'basic': return 'Basic';
      default: return 'Free';
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      background: '#fff', 
      borderRadius: 16, 
      boxShadow: '0 2px 8px #e3e3e3', 
      padding: '24px', 
      border: '1px solid #e3e3e3',
      marginBottom: 16
    }}>
      <div style={{ 
        fontSize: '1.4rem', 
        color: '#2d3a4a', 
        fontWeight: 800, 
        marginBottom: 20, 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: '1.4rem' }}>💳</span> Subscription & Payment
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div style={{ 
          marginBottom: 24, 
          padding: '16px', 
          borderRadius: 12, 
          background: '#f8f9fa', 
          border: `2px solid ${getStatusColor(subscription.subscription_status)}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
            Current Plan: <span style={{ color: getStatusColor(subscription.subscription_status) }}>
              {getStatusText(subscription.subscription_status)}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Member since: {new Date(subscription.created_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: '#2d3a4a', marginBottom: 16, textAlign: 'center' }}>
          Choose Your Plan
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                flex: 1,
                minWidth: 280,
                maxWidth: 320,
                padding: '24px',
                borderRadius: 16,
                border: selectedPlan?.id === plan.id 
                  ? `3px solid ${plan.color}` 
                  : '2px solid #e3e3e3',
                background: selectedPlan?.id === plan.id 
                  ? `${plan.color}20` 
                  : '#fff',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px #e3e3e3'
              }}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ff9800',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  MOST POPULAR
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#2d3a4a', marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3a4a' }}>
                  ${plan.price}
                  <span style={{ fontSize: '1rem', color: '#666' }}>/month</span>
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ 
                    marginBottom: 8, 
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ color: '#4caf50', fontSize: '1.1rem' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      {selectedPlan && (
        <div style={{ marginBottom: 16 }}>
          <StripePaymentForm 
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div style={{ 
          padding: '12px', 
          borderRadius: 8, 
          background: message.includes('successful') ? '#e8f5e8' : '#ffebee',
          color: message.includes('successful') ? '#2d3a4a' : '#e57373',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      {/* Security Notice */}
      <div style={{ 
        marginTop: 16, 
        padding: '12px', 
        borderRadius: 8, 
        background: '#e8f5e8', 
        border: '1px solid #c8e6c9',
        fontSize: '0.8rem',
        color: '#2e7d32',
        textAlign: 'center'
      }}>
        🔒 Secure Payment: Your payment information is processed securely by Stripe. 
        We never store your card details on our servers.
      </div>
    </div>
  );
} 