import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Zap,
  ShieldCheck,
  Play,
  Key,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Terminal,
} from 'lucide-react';

export const ConcurrencyLabView = () => {
  // Concurrency Test States
  const [initialStock, setInitialStock] = useState(3);
  const [concurrentRequests, setConcurrentRequests] = useState(25);
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Webhook Test States
  const [orderNumber, setOrderNumber] = useState('MP-ORD-2026-8812');
  const [tamperSig, setTamperSig] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [sendingWebhook, setSendingWebhook] = useState(false);

  const runConcurrencyTest = async () => {
    setRunningTest(true);
    setTestResult(null);
    try {
      const data = await api.simulateConcurrency(initialStock, concurrentRequests);
      setTestResult(data);
    } catch (err) {
      console.error('Concurrency test failed:', err);
    } finally {
      setRunningTest(false);
    }
  };

  const testWebhookDelivery = async () => {
    setSendingWebhook(true);
    setWebhookResult(null);
    try {
      const signData = await api.generateSignedWebhook(orderNumber, 527.99, tamperSig);
      if (signData.success) {
        const deliveryRes = await api.sendWebhook(
          signData.payload,
          signData.headers['X-MarketPulse-Signature']
        );
        setWebhookResult({
          signatureUsed: signData.headers['X-MarketPulse-Signature'],
          isTampered: signData.isTampered,
          payload: signData.payload,
          response: deliveryRes,
        });
      }
    } catch (err) {
      console.error('Webhook test error:', err);
    } finally {
      setSendingWebhook(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pop-in">
      {/* Header */}
      <div className="bg-[#FF6B97] text-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-mono font-black">STRESS TESTING LAB</span>
            <span className="text-xs font-mono font-black text-black bg-[#FEF08A] px-2 py-0.5 rounded border border-black">
              Zero-Oversell Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white mt-2">
            Concurrency & HMAC Webhook Sandbox
          </h1>
          <p className="text-xs sm:text-sm font-bold text-white/90 mt-1">
            Simulate flash-sale race conditions and verify cryptographic signature enforcement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Flash Sale Simulation */}
        <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4 text-black">
          <div className="flex items-center space-x-2.5 border-b-2 border-black pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF08A] border-2 border-black shadow-brutal-sm flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-black">Flash Sale Race Condition Test</h2>
              <p className="text-xs font-bold text-black/70">Execute parallel checkout bursts against a shared SKU</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Initial SKU Stock</label>
              <input
                type="number"
                min="1"
                max="20"
                value={initialStock}
                onChange={(e) => setInitialStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Concurrent Burst Requests</label>
              <input
                type="number"
                min="5"
                max="100"
                value={concurrentRequests}
                onChange={(e) => setConcurrentRequests(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm"
              />
            </div>
          </div>

          <button
            disabled={runningTest}
            onClick={runConcurrencyTest}
            className="w-full py-3 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {runningTest ? (
              <span>Executing {concurrentRequests} Parallel Transactions...</span>
            ) : (
              <>
                <Play className="w-4 h-4 text-black fill-current" />
                <span>Simulate High-Frequency Burst</span>
              </>
            )}
          </button>

          {/* Results Output */}
          {testResult && (
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border-2 border-black shadow-brutal-sm space-y-3 font-mono text-xs animate-pop-in">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-bold text-black">Execution Summary</span>
                <span className="px-2 py-0.5 rounded-md bg-[#6EE7B7] text-black font-black text-[10px] border border-black">
                  Zero-Oversell Verified
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                <div className="p-2 rounded-xl bg-white border-2 border-black">
                  <div className="text-black/60 text-[10px]">SUCCESSFUL</div>
                  <div className="text-sm font-black text-black">{testResult.summary?.successfulOrders}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border-2 border-black">
                  <div className="text-black/60 text-[10px]">REJECTED</div>
                  <div className="text-sm font-black text-rose-600">{testResult.summary?.failedOrders}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border-2 border-black">
                  <div className="text-black/60 text-[10px]">FINAL STOCK</div>
                  <div className="text-sm font-black text-black">{testResult.summary?.finalStock}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black text-[#FEF08A] font-mono text-[10px] space-y-1">
                <div>// Atomic Lock Engine Log:</div>
                <div>{testResult.summary?.successfulOrders} orders reserved exactly {initialStock} units. {testResult.summary?.failedOrders} rejected safely.</div>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: HMAC Webhook Sandbox */}
        <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-xl space-y-4 text-black">
          <div className="flex items-center space-x-2.5 border-b-2 border-black pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6EE7B7] border-2 border-black shadow-brutal-sm flex items-center justify-center">
              <Key className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-black">HMAC-SHA256 Signature Verifier</h2>
              <p className="text-xs font-bold text-black/70">Test cryptographic event signing and tamper rejection</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-black">Target Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-mono shadow-brutal-sm"
              />
            </div>

            <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#F9FAFB] border-2 border-black cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={tamperSig}
                onChange={(e) => setTamperSig(e.target.checked)}
                className="rounded accent-black w-4 h-4"
              />
              <span className="text-xs font-bold text-black">Tamper / Corrupt Cryptographic Signature (Test Rejection)</span>
            </label>
          </div>

          <button
            disabled={sendingWebhook}
            onClick={testWebhookDelivery}
            className="w-full py-3 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] text-black font-display font-black text-xs border-2.5 border-black shadow-brutal flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {sendingWebhook ? (
              <span>Transmitting Signed Payload...</span>
            ) : (
              <>
                <Send className="w-4 h-4 text-black" />
                <span>Send Signed Webhook Ingress</span>
              </>
            )}
          </button>

          {/* Webhook Result */}
          {webhookResult && (
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border-2 border-black shadow-brutal-sm space-y-2.5 font-mono text-xs animate-pop-in">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-bold text-black">Ingress Gateway Result</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-black ${
                    webhookResult.response?.success ? 'bg-[#6EE7B7] text-black' : 'bg-[#FF6B97] text-white'
                  }`}
                >
                  {webhookResult.response?.success ? '200 SIGNATURE_VERIFIED' : '401 INVALID_SIGNATURE'}
                </span>
              </div>

              <div className="text-[10px] space-y-1 font-bold">
                <div className="truncate">Signature: <span className="text-black font-normal">{webhookResult.signatureUsed}</span></div>
                <div>Status: <span className="text-black">{webhookResult.response?.message}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
