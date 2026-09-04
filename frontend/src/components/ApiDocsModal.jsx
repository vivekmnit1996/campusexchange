import React from 'react';
import {
  X,
  FileCode,
  Download,
} from 'lucide-react';

export const ApiDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const endpoints = [
    { method: 'POST', path: '/api/v1/auth/register', desc: 'Register customer or vendor account' },
    { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate with email and password to receive JWT' },
    { method: 'GET', path: '/api/v1/auth/me', desc: 'Retrieve authenticated profile and store data' },
    { method: 'GET', path: '/api/v1/products', desc: 'Multi-faceted catalog search with full-text indexing & filters' },
    { method: 'POST', path: '/api/v1/products', desc: 'Create new product listing (Vendor role)' },
    { method: 'POST', path: '/api/v1/products/:id/reviews', desc: 'Submit verified customer star review & rating' },
    { method: 'POST', path: '/api/v1/orders', desc: 'Unified multi-vendor checkout with atomic stock reservation' },
    { method: 'GET', path: '/api/v1/orders/mine', desc: 'Fetch customer order history and partitioned fulfillments' },
    { method: 'PATCH', path: '/api/v1/orders/:id/cancel', desc: 'Cancel order, restore stock, and reverse ledger' },
    { method: 'GET', path: '/api/v1/vendor/dashboard', desc: 'Vendor earnings, sub-orders pipeline, and catalog stats' },
    { method: 'GET', path: '/api/v1/stores/:slug', desc: 'Retrieve vendor storefront bio & exclusive catalog' },
    { method: 'GET', path: '/api/v1/analytics/platform', desc: 'MongoDB aggregation pipeline for GMV & leaderboard' },
    { method: 'POST', path: '/api/v1/webhooks/payment', desc: 'HMAC-SHA256 signature verified payment event ingress' },
  ];

  const handleDownloadPostman = () => {
    fetch('/marketpulse_postman_collection.json')
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marketpulse_postman_collection.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error('Download failed:', err));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border-3 border-black rounded-3xl shadow-brutal-xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto z-10 text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#67E8F9] border-2 border-black shadow-brutal-sm flex items-center justify-center text-black">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-black">API Reference & Postman</h2>
              <p className="text-[11px] font-mono font-bold text-black/70">RESTful v1 Endpoints</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Download Postman */}
        <div className="p-4 rounded-2xl bg-[#FEF08A] border-2.5 border-black shadow-brutal flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-display font-black text-black">Postman Collection v2.1</div>
            <p className="text-[11px] font-bold text-black/80">Pre-configured requests with automated JWT token extraction.</p>
          </div>

          <button
            onClick={handleDownloadPostman}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm flex items-center space-x-1.5 whitespace-nowrap transition"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
        </div>

        {/* Endpoints List */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-black uppercase text-black">Mounted Endpoints</div>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#F9FAFB] border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono font-bold shadow-xs"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg border border-black text-[10px] font-black ${
                      ep.method === 'GET'
                        ? 'bg-[#C4B5FD]'
                        : ep.method === 'POST'
                        ? 'bg-[#6EE7B7]'
                        : 'bg-[#FEF08A]'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-black">{ep.path}</span>
                </div>
                <span className="text-[11px] text-black/70 font-sans font-semibold">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
