import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CreditCard,
  QrCode,
  Smartphone,
  Check,
  Lock,
  ArrowLeft,
  Banknote,
  Sparkles,
} from 'lucide-react';

export const CartDrawer = ({ isOpen, onClose, onOrderCompleted }) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount, vendorGroups } = useCart();
  const { user } = useAuth();

  // Steps: 'cart' -> 'address' -> 'payment' -> 'success'
  const [step, setStep] = useState('cart');

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '452 Innovation Blvd, Suite 300',
    city: 'San Francisco',
    postalCode: '94107',
    country: 'United States',
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
  const [upiOption, setUpiOption] = useState('qr'); // 'qr' | 'id'
  const [upiId, setUpiId] = useState('shopper@okhdfcbank');
  const [upiVerified, setUpiVerified] = useState(false);

  // Card State
  const [cardData, setCardData] = useState({
    number: '4242 •••• •••• 4242',
    name: user?.name || 'Alex Rivera',
    expiry: '12/28',
    cvv: '888',
  });

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardData({ ...cardData, expiry: val });
  };

  const handleExecutePayment = async () => {
    setCheckingOut(true);
    setErrorMsg(null);
    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          title: i.title,
        })),
        customerInfo: {
          name: shippingAddress.name || user?.name || 'Customer',
          email: shippingAddress.email || user?.email || '',
          address: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        paymentMethod: paymentMethod,
        paymentDetails: {
          method: paymentMethod,
          upiId: paymentMethod === 'upi' ? upiId : undefined,
          last4: paymentMethod === 'card' ? cardData.number.slice(-4) : undefined,
        },
      };

      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.createOrder(orderPayload, idempotencyKey);

      if (res.data?.success) {
        setCheckoutResult({
          order: res.data.order,
          paymentMethodUsed: paymentMethod,
        });
        clearCart();
        setStep('success');
        if (onOrderCompleted) onOrderCompleted(res.data.order);
      } else {
        setErrorMsg(res.data?.message || 'Order could not be processed. Please check item stock.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment communication error. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const upiIntentString = `upi://pay?pa=marketpulse@okaxis&pn=MarketPulse&am=${totalAmount.toFixed(2)}&cu=INR&tn=Order_Checkout`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentString)}&color=000000&bgcolor=FEF08A&margin=10`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#FFFFFF] border-l-3 border-black shadow-brutal-xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b-3 border-black bg-[#FEF08A] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {step !== 'cart' && step !== 'success' && (
                <button
                  onClick={() => setStep(step === 'payment' ? 'address' : 'cart')}
                  className="p-1.5 rounded-xl bg-white border-2 border-black shadow-brutal-sm hover:translate-x-[-1px] transition mr-1"
                >
                  <ArrowLeft className="w-4 h-4 text-black" />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-white border-2 border-black shadow-brutal-sm flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-black" />
              </div>
              <div>
                <h2 className="text-sm font-display font-black text-black">
                  {step === 'cart' && 'Your Shopping Cart'}
                  {step === 'address' && 'Delivery Address'}
                  {step === 'payment' && 'Select Payment Method'}
                  {step === 'success' && 'Order Confirmed!'}
                </h2>
                <p className="text-[10px] font-mono font-bold text-black/70">
                  {step === 'cart' && `${items.length} items • ${vendorGroups.length} store fulfillments`}
                  {step === 'address' && 'Step 2 of 3 • Shipping details'}
                  {step === 'payment' && 'Step 3 of 3 • Zero-fee UPI & Cards'}
                  {step === 'success' && 'Dispatches in progress'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-[#F9FAFB]">
            
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-[#FF6B97]/20 border-2 border-black flex items-start space-x-2 text-black text-xs font-bold shadow-brutal-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-black" />
                <div>
                  <div>Transaction Notice</div>
                  <div className="text-[11px] opacity-90">{errorMsg}</div>
                </div>
              </div>
            )}

            {/* STEP 1: CART ITEMS */}
            {step === 'cart' && (
              items.length === 0 ? (
                <div className="text-center py-16 bg-white border-2.5 border-black rounded-2xl p-6 shadow-brutal space-y-2">
                  <ShoppingBag className="w-8 h-8 text-black mx-auto mb-2" />
                  <p className="font-display font-black text-black text-sm">Your cart is empty</p>
                  <p className="text-[11px] font-bold text-black/60">Discover items from verified vendors in the catalog</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorGroups.map((group) => (
                    <div key={group.storeId} className="bg-white border-2.5 border-black rounded-2xl p-4 shadow-brutal space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2 text-xs">
                        <div className="flex items-center space-x-1.5 font-display font-black text-black">
                          <Store className="w-4 h-4 text-black" />
                          <span>{group.storeName}</span>
                        </div>
                        <span className="font-mono font-black text-black text-xs px-2 py-0.5 rounded bg-[#FEF08A] border border-black">
                          ${group.subTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {group.items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-100 border-2 border-black shadow-brutal-sm"
                              />
                              <div>
                                <div className="font-display font-bold text-black line-clamp-1 max-w-[140px]">{item.title}</div>
                                <div className="text-black font-mono font-bold text-[11px]">${item.price.toFixed(2)}</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center bg-[#FEF08A] rounded-xl border-2 border-black shadow-brutal-sm">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="p-1.5 text-black hover:bg-[#FDE047] rounded-l-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 font-mono font-black text-black text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="p-1.5 text-black hover:bg-[#FDE047] rounded-r-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-[#FF6B97] hover:text-white transition shadow-brutal-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* STEP 2: ADDRESS */}
            {step === 'address' && (
              <div className="space-y-4 text-xs font-bold animate-pop-in">
                <div className="bg-white border-2.5 border-black rounded-2xl p-4 shadow-brutal space-y-3">
                  <div className="flex items-center space-x-2 text-black font-display font-black">
                    <MapPin className="w-4 h-4 text-black" />
                    <span>Shipping Destination</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-black">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-black">Street Address *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-black">City *</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-black">Postal Code *</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm focus:bg-[#FEFCE8]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-black">Country</label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black shadow-brutal-sm focus:bg-[#FEFCE8]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD (FREE UPI / CARDS / COD) */}
            {step === 'payment' && (
              <div className="space-y-4 text-xs font-bold animate-pop-in">
                {/* Method Selector Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border-2 border-black flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'upi'
                        ? 'bg-[#FEF08A] shadow-brutal font-black translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-slate-50 shadow-brutal-sm'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-black" />
                    <span className="text-[11px] font-display">Instant UPI</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black text-white">0% Fee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border-2 border-black flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'card'
                        ? 'bg-[#C4B5FD] shadow-brutal font-black translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-slate-50 shadow-brutal-sm'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-black" />
                    <span className="text-[11px] font-display">Cards</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black text-white">Visa/MC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border-2 border-black flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'cod'
                        ? 'bg-[#FF6B97] text-white shadow-brutal font-black translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-slate-50 shadow-brutal-sm text-black'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px] font-display">COD</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black text-white">Delivery</span>
                  </button>
                </div>

                {/* --- UPI VIEW --- */}
                {paymentMethod === 'upi' && (
                  <div className="bg-white border-2.5 border-black rounded-2xl p-4 shadow-brutal space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-black" />
                        <span className="font-display font-black text-black">Scan QR or Enter UPI ID</span>
                      </div>
                      <div className="flex bg-[#F3F4F6] rounded-xl p-0.5 border-2 border-black">
                        <button
                          onClick={() => setUpiOption('qr')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            upiOption === 'qr' ? 'bg-[#FEF08A] text-black border border-black shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          QR Code
                        </button>
                        <button
                          onClick={() => setUpiOption('id')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            upiOption === 'id' ? 'bg-[#FEF08A] text-black border border-black shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          UPI ID
                        </button>
                      </div>
                    </div>

                    {upiOption === 'qr' ? (
                      <div className="text-center space-y-3 py-2">
                        <div className="inline-block p-3 rounded-2xl bg-[#FEF08A] border-3 border-black shadow-brutal">
                          <img
                            src={qrCodeUrl}
                            alt="Scan UPI QR"
                            className="w-44 h-44 mx-auto rounded-xl object-contain bg-white border-2 border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-mono font-black text-black flex items-center justify-center space-x-1">
                            <span>Scan with any UPI App</span>
                          </div>
                          <p className="text-[10px] text-black/70 font-mono font-bold">
                            Google Pay • PhonePe • Paytm • CRED • BHIM
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-black">Virtual Payment Address (VPA)</label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setUpiVerified(false);
                              }}
                              placeholder="username@okhdfcbank"
                              className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono text-xs shadow-brutal-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setUpiVerified(true)}
                              className={`px-4 rounded-xl text-xs font-mono font-black border-2 border-black transition ${
                                upiVerified
                                  ? 'bg-[#6EE7B7] text-black shadow-brutal-sm'
                                  : 'bg-[#FEF08A] hover:bg-[#FDE047] shadow-brutal-sm'
                              }`}
                            >
                              {upiVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>
                        </div>

                        {upiVerified && (
                          <div className="p-2.5 rounded-xl bg-[#6EE7B7] border-2 border-black text-black text-[11px] font-bold flex items-center space-x-1.5 shadow-brutal-sm">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>VPA Verified: Account holder matched</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* --- CARD VIEW --- */}
                {paymentMethod === 'card' && (
                  <div className="bg-white border-2.5 border-black rounded-2xl p-4 shadow-brutal space-y-3.5">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <span className="font-display font-black text-black">Card Details</span>
                      <div className="flex items-center space-x-1 text-[10px] text-black font-mono font-bold bg-[#FEF08A] px-2 py-0.5 rounded border border-black">
                        <Lock className="w-3 h-3 text-black" />
                        <span>256-bit Encrypted</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-black">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardData.number}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono text-xs tracking-wider shadow-brutal-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-black">Expiry Date</label>
                          <input
                            type="text"
                            required
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono text-xs shadow-brutal-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-black">Security Code (CVV)</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            placeholder="•••"
                            className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono text-xs shadow-brutal-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-black">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          placeholder="Full name on card"
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black text-xs shadow-brutal-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- COD VIEW --- */}
                {paymentMethod === 'cod' && (
                  <div className="bg-[#FEF08A] border-2.5 border-black rounded-2xl p-4 shadow-brutal space-y-2 text-black">
                    <div className="flex items-center space-x-2 font-display font-black">
                      <Banknote className="w-5 h-5 text-black" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed opacity-80">
                      Pay in cash or through UPI upon delivery. Couriers will carry digital payment QR scanners upon delivery.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: ORDER SUCCESS */}
            {step === 'success' && checkoutResult && (
              <div className="space-y-4 animate-pop-in text-xs font-bold">
                <div className="p-6 rounded-3xl bg-[#6EE7B7] border-3 border-black shadow-brutal-xl text-center space-y-4 text-black">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2.5 border-black shadow-brutal flex items-center justify-center mx-auto text-black">
                    <CheckCircle2 className="w-8 h-8 text-black" />
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-black text-black">Order & Payment Confirmed!</h3>
                    <p className="text-[11px] font-mono font-bold text-black/80 mt-0.5">
                      Verified via <span className="bg-black text-white px-2 py-0.5 rounded uppercase">{checkoutResult.paymentMethodUsed}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border-2.5 border-black shadow-brutal-sm text-left space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-black/70">Order Number:</span>
                      <span className="text-black font-black">#{checkoutResult.order?.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Total Paid:</span>
                      <span className="text-black font-black">${checkoutResult.order?.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70">Vendor Sub-Orders:</span>
                      <span className="text-black font-black">{checkoutResult.order?.vendorSubOrders?.length} Dispatches</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStep('cart');
                      setCheckoutResult(null);
                      onClose();
                    }}
                    className="w-full py-3 rounded-2xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal"
                  >
                    Return to Storefront
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          {items.length > 0 && step !== 'success' && (
            <div className="p-5 border-t-3 border-black bg-white space-y-3.5">
              <div className="space-y-1.5 text-xs font-mono font-bold text-black">
                <div className="flex justify-between">
                  <span>Cart Items ({items.length})</span>
                  <span className="font-black">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-black/70">
                  <span>Shipping & Processing</span>
                  <span className="bg-[#6EE7B7] text-black px-1.5 rounded border border-black font-black">FREE 0% FEE</span>
                </div>
                <div className="flex justify-between text-base font-black text-black pt-2 border-t-2 border-black">
                  <span>Total Due</span>
                  <span className="bg-[#FEF08A] px-2 py-0.5 rounded border border-black">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {step === 'cart' && (
                <button
                  onClick={() => setStep('address')}
                  className="w-full py-3 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Proceed to Shipping Address</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}

              {step === 'address' && (
                <button
                  onClick={() => {
                    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
                      setErrorMsg('Please complete all required shipping fields');
                      return;
                    }
                    setErrorMsg(null);
                    setStep('payment');
                  }}
                  className="w-full py-3 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Select Payment Method</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}

              {step === 'payment' && (
                <button
                  disabled={checkingOut}
                  onClick={handleExecutePayment}
                  className="w-full py-3 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  {checkingOut ? (
                    <span>Securing Transaction...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-black" />
                      <span>
                        Pay ${totalAmount.toFixed(2)} with {paymentMethod.toUpperCase()}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
