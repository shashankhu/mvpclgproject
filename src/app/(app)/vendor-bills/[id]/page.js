"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROLES, VENDOR_CATEGORY_LABELS } from "@/lib/constants";
import { Receipt, CreditCard, CheckCircle, Clock, AlertCircle, FileText, Download, UserCircle, Phone, ArrowLeft, Loader2, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VendorBillDetailPage({ params }) {
  const { id } = use(params);
  const { apiFetch, user } = useAuth();
  
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Finance Update State
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentComment, setPaymentComment] = useState("");
  const [billNumber, setBillNumber] = useState("");

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/vendor-bills/${id}`);
      setBill(data.vendorBill);
      setPaymentStatus(data.vendorBill.paymentStatus);
      setPaymentReference(data.vendorBill.paymentReference || "");
      setPaymentComment(data.vendorBill.paymentComment || "");
      setBillNumber(data.vendorBill.billNumber || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch(`/api/vendor-bills/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentStatus,
          paymentReference,
          paymentComment,
          billNumber,
        }),
      });
      await fetchDetail(); // Reload
      alert("Bill updated successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isFinance = user?.role === ROLES.FINANCE || user?.role === ROLES.SUPER_ADMIN;
  const isVendor = user?.role === ROLES.VENDOR;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading bill details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!bill) return <div className="p-8 text-center text-slate-500">Bill not found</div>;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/vendor-bills" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Receipt className="h-6 w-6 mr-2 text-indigo-600" /> 
            Invoice Detail
          </h1>
          <p className="text-sm text-slate-500 mt-1">Generated on {formatDate(bill.createdAt)}</p>
        </div>
        
        <div>
          {bill.paymentStatus === "pending" && <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-200 flex items-center"><Clock className="w-4 h-4 mr-1.5"/> Pending</span>}
          {bill.paymentStatus === "processing" && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5"/> Processing</span>}
          {bill.paymentStatus === "paid" && <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200 flex items-center"><CheckCircle className="w-4 h-4 mr-1.5"/> Paid on {bill.paymentDate ? formatDate(bill.paymentDate) : "N/A"}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bill Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Payment Breakdown</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Base Amount</span>
              <span className="font-medium text-slate-900">₹{Number(bill.billAmount).toLocaleString("en-IN")}</span>
            </div>
            {bill.taxAmount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Tax Amount</span>
                <span className="font-medium text-slate-900">₹{Number(bill.taxAmount).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-base font-semibold text-slate-900">Total Payable</span>
              <span className="text-2xl font-bold text-indigo-700">₹{Number(bill.totalAmount).toLocaleString("en-IN")}</span>
            </div>

            <div className="pt-6 border-t border-slate-200 mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Invoice Number (Vendor)</span>
                <span className="font-medium text-slate-900">{bill.billNumber || "Not Provided"}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Internal Reference</span>
                <span className="font-medium text-slate-900">{bill.id.slice(-8).toUpperCase()}</span>
              </div>
              {bill.paymentReference && (
                <div className="col-span-2 mt-2 bg-green-50 p-3 rounded-lg border border-green-100">
                  <span className="block text-green-800 text-xs font-semibold uppercase mb-1">Transaction Ref</span>
                  <span className="font-medium text-green-900 font-mono tracking-wider">{bill.paymentReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vendor & Event Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 border-b pb-2">Contract Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Event Requirement</span>
                <Link href={`/quotation-requests/${bill.quotationRequestId}`} className="font-medium text-indigo-600 hover:underline">
                  {bill.quotationRequest.title}
                </Link>
                <div className="text-slate-500 mt-0.5">{bill.event.title} • {formatDate(bill.event.eventDate)}</div>
              </div>

              {!isVendor && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Awarded To</span>
                  <div className="font-medium text-slate-900">{bill.vendor.companyName}</div>
                  <div className="text-slate-600 flex items-center mt-1"><UserCircle className="h-4 w-4 mr-1.5 text-slate-400"/> {bill.vendor.contactPerson}</div>
                  <div className="text-slate-600 flex items-center mt-0.5"><Phone className="h-4 w-4 mr-1.5 text-slate-400"/> {bill.vendor.phone}</div>
                  <div className="text-slate-600 font-mono mt-1 text-xs">GST: {bill.vendor.gstNumber || "N/A"}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finance Processing Action Box */}
      {isFinance && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-200 bg-indigo-50 flex items-center">
             <CreditCard className="h-5 w-5 mr-2 text-indigo-700" />
             <h3 className="text-lg font-semibold text-indigo-900">Finance Processing</h3>
          </div>
          <form onSubmit={handleUpdate} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Status Update</label>
                 <select 
                   value={paymentStatus} 
                   onChange={(e) => setPaymentStatus(e.target.value)}
                   className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 >
                   <option value="pending">Pending Review</option>
                   <option value="processing">Processing Payment</option>
                   <option value="paid">Mark as Paid</option>
                   <option value="rejected">Reject Invoice</option>
                 </select>
                 <p className="mt-1 text-xs text-slate-500">Updating to "Paid" will notify the vendor.</p>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Reference No.</label>
                 <input 
                   type="text" 
                   value={paymentReference} 
                   onChange={(e) => setPaymentReference(e.target.value)}
                   placeholder="e.g. UTR / Cheque Number"
                   className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Internal Finance Comments</label>
                 <textarea 
                   rows={2}
                   value={paymentComment} 
                   onChange={(e) => setPaymentComment(e.target.value)}
                   placeholder="Add notes about this payment processing..."
                   className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Invoice Number</label>
                 <input 
                   type="text" 
                   value={billNumber} 
                   onChange={(e) => setBillNumber(e.target.value)}
                   placeholder="If provided by vendor manually"
                   className="w-full rounded-md border-[amber]-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t flex justify-end">
               <button 
                 type="submit" 
                 disabled={actionLoading}
                 className="btn-primary"
               >
                 {actionLoading ? "Saving..." : "Save Finance Updates"}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor View Comments */}
      {isVendor && bill.paymentComment && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4">
           <div className="shrink-0">
             <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
               <Info className="h-5 w-5 text-slate-500" />
             </div>
           </div>
           <div>
             <h4 className="text-sm font-semibold text-slate-900">Message from Accounts Department</h4>
             <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">{bill.paymentComment}</p>
           </div>
        </div>
      )}
    </div>
  );
}
