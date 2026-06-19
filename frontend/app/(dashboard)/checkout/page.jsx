'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productApi, userApi, orderApi, paymentApi, inventoryApi } from '@/lib/api';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const queryProductId = searchParams.get('productId');
  const queryQuantity = parseInt(searchParams.get('quantity') || '1');
  const queryOrderId = searchParams.get('orderId');

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data state
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [quantity, setQuantity] = useState(queryQuantity);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Order state
  const [order, setOrder] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form input state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch addresses for selection
        const { data: addressData } = await userApi.getAddresses();
        const addrList = addressData.data || addressData || [];
        setAddresses(addrList);
        if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id);
        }

        // If paying for existing order
        if (queryOrderId) {
          const { data: orderData } = await orderApi.get(queryOrderId);
          const currentOrder = orderData.data || orderData;
          setOrder(currentOrder);
          setPaymentStep(true);
        } 
        // If placing a new order
        else if (queryProductId) {
          const { data: prodData } = await productApi.get(queryProductId);
          setProduct(prodData.data || prodData);
          try {
            const { data: invData } = await inventoryApi.get(queryProductId);
            setInventory(invData.data || invData);
          } catch (invErr) {
            console.error('Inventory not initialized/found for product:', invErr);
          }
        } else {
          setError('No product or order specified for checkout.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load checkout details.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [queryProductId, queryOrderId]);

  // Compute prices
  const subtotal = product ? product.price * quantity : (order ? order.subtotal : 0);
  const shippingCharge = subtotal >= 50000 ? 0 : 4900; // Free above ₹500
  const grandTotal = subtotal + shippingCharge;

  const formatPrice = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // 2. Place Order handler
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }
    if (!inventory) {
      setError('Cannot place order. Product stock information is not initialized.');
      return;
    }
    if (quantity > inventory.quantity) {
      setError(`Cannot place order. Requested quantity (${quantity}) exceeds available stock (${inventory.quantity}).`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        items: [{ product_id: product.id, quantity }],
        address_id: selectedAddressId
      };
      const { data } = await orderApi.create(payload);
      const newOrder = data.data || data;
      setOrder(newOrder);
      setPaymentStep(true);
      setSuccess('Order placed! Please complete the payment.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Payment Checkout handler
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      setError('Please fill in all credit card details.');
      return;
    }

    setPaymentLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        order_id: order.id,
        amount: order.total_amount,
        card_number: cardNumber.replace(/\s+/g, ''),
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
      };

      const { data } = await paymentApi.checkout(payload);
      setSuccess('Payment successful! Your order has been confirmed.');
      
      // Update order state
      setOrder(prev => ({
        ...prev,
        payment_status: 'paid',
        status: 'confirmed',
        payment_id: data.data?.id
      }));

    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = err.response.data.errors.map(e => e.message).join(', ');
        setError(`Validation failed: ${fieldErrors}`);
      } else {
        setError(err.response?.data?.message || 'Payment processing failed.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Quick fill helper cards
  const fillSuccessCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvv('123');
  };

  const fillFailedCard = () => {
    setCardNumber('4242 4242 4242 9999');
    setCardExpiry('06/27');
    setCardCvv('999');
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {paymentStep ? 'Complete payment for your order.' : 'Review items and select shipping address.'}
        </p>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Success page state */}
      {order && order.payment_status === 'paid' ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-950">Payment Received Successfully!</h2>
            <p className="text-sm text-zinc-500">Your order has been confirmed and inventory stock updated.</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => router.push('/orders')}>
              Go to My Orders
            </Button>
            <Button variant="secondary" onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main forms column */}
          <div className="md:col-span-2 space-y-6">
            {!paymentStep ? (
              // Step 1: Address selection
              <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="font-semibold text-zinc-950">Shipping Address</h3>
                  <Button variant="secondary" size="xs" onClick={() => router.push('/addresses')}>
                    Manage Addresses
                  </Button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-zinc-500">You don't have any shipping addresses yet.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => router.push('/addresses')}>
                      Add New Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block rounded-xl border p-4 cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 ${
                          selectedAddressId === addr.id
                            ? 'border-indigo-600 bg-indigo-50/10'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-indigo-600 h-4 w-4"
                          />
                          <div className="text-sm text-zinc-700 space-y-0.5">
                            <p className="font-medium text-zinc-950">{addr.full_name}</p>
                            <p className="text-zinc-500 text-xs">{addr.phone}</p>
                            <p>{addr.line1}</p>
                            {addr.line2 && <p>{addr.line2}</p>}
                            <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-zinc-400 text-xs uppercase font-medium mt-1">{addr.country}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Step 2: Payment forms
              <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5 shadow-sm">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="font-semibold text-zinc-950">Simulated Payment</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    This form simulates Stripe credit card processing.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={fillSuccessCard}
                    className="flex flex-col text-left p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-900">⚡ Test Success</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Fills card details that simulate successful payment.</span>
                  </button>
                  <button
                    onClick={fillFailedCard}
                    className="flex flex-col text-left p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-red-600">❌ Test Decline</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Fills details that simulate card decline failure.</span>
                  </button>
                </div>

                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength="4"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 mt-2 font-semibold tracking-wide"
                    disabled={paymentLoading}
                    isLoading={paymentLoading}
                  >
                    Pay {formatPrice(grandTotal)}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Order Summary sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-zinc-950 border-b border-zinc-100 pb-3">Order Summary</h3>
              
              {/* Product Info */}
              {!order && product ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">{product.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Quantity: {quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-zinc-900">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                  {inventory ? (
                    <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-xs mt-1">
                      <span className="text-zinc-500 font-medium">Stock Status:</span>
                      {inventory.quantity >= quantity ? (
                        <span className="text-emerald-600 font-semibold">Available ({inventory.quantity} in stock)</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Out of Stock ({inventory.quantity} in stock)</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-2 rounded-lg text-xs mt-1 animate-pulse">
                      <span className="text-amber-600 font-semibold">No stock information initialized</span>
                    </div>
                  )}
                </div>
              ) : (
                order && (
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-zinc-900 truncate">{item.product_name}</h4>
                          <p className="text-xs text-zinc-400 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right font-medium text-zinc-700">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <hr className="border-zinc-100" />

              {/* Price calculations */}
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-zinc-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-zinc-800">
                    {shippingCharge === 0 ? 'Free' : formatPrice(shippingCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-dashed border-zinc-100">
                  <span>Grand Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Actions */}
              {!paymentStep && (
                <Button
                  variant="primary"
                  className="w-full py-3"
                  onClick={handlePlaceOrder}
                  disabled={loading || !inventory || quantity > inventory.quantity}
                  isLoading={loading}
                >
                  {!inventory ? 'Stock Not Initialized' : quantity > inventory.quantity ? 'Insufficient Stock' : 'Place Order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        Loading Checkout Content...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
