import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe (you'll need to add your publishable key to .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
function PaymentForm({ plan, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const intentResponse = await fetch(`${API_URL}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : ''}`
        },
        body: JSON.stringify({ plan: plan.id })
      });

      const intentData = await intentResponse.json();
      
      if (!intentResponse.ok) {
        throw new Error(intentData.error || 'Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Process the successful payment
        const processResponse = await fetch(`${API_URL}/payment/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : ''}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            plan: plan.id
          })
        });

        const processData = await processResponse.json();
        
        if (!processResponse.ok) {
          throw new Error(processData.error || 'Failed to process payment');
        }

        onSuccess(processData);
      }
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          fontSize: '1rem', 
          fontWeight: 600, 
          color: '#2d3a4a' 
        }}>
          Card Information
        </label>
        <div style={{
          padding: '12px',
          border: '2px solid #e3e3e3',
          borderRadius: 8,
          background: '#fff'
        }}>
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: 16,
          borderRadius: 8,
          background: '#ffebee',
          color: '#c62828',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: 'white',
          background: isProcessing ? '#ccc' : 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)',
          border: 'none',
          borderRadius: 8,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: isProcessing ? 0.7 : 1
        }}
      >
        {isProcessing ? 'Processing...' : `Pay $${plan.price}`}
      </button>
    </form>
  );
}

// Main component that wraps the payment form with Stripe Elements
export default function StripePaymentForm({ plan, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm plan={plan} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
} 