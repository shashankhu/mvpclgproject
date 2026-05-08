"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLES, VENDOR_CATEGORY_LABELS } from "@/lib/constants";
import { ReceiptText, FileText, Download, CheckCircle, AlertTriangle, Building2, UserCircle, Phone, IndianRupee, Loader2, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function QuotationRequestDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { apiFetch, user } = useAuth();
  
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Award Modal State
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [awardComment, setAwardComment] = useState("");
  const [showAwardModal, setShowAwardModal] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/quotation-requests/${id}`);
      setQr(data.quotationRequest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAward = async () => {
    if (!selectedVendorId) return;
    
    setActionLoading(true);
    try {
      await apiFetch(`/api/quotation-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "award", vendorId: selectedVendorId, awardComment }),
      });
      setShowAwardModal(false);
      await fetchDetail(); // Reload
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to close this request without awarding anyone? Vendors will no longer be able to submit quotations.")) return;
    
    setActionLoading(true);
    try {
      await apiFetch(`/api/quotation-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "close" }),
      });
      await fetchDetail(); // Reload
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isVendor = user?.role === ROLES.VENDOR;
  const isAdminOrDean = [ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!qr) return <div className="p-8 text-center text-slate-500">Not found</div>;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/quotation-requests" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">{qr.title}</h1>
          <p className="text-sm text-slate-600 mt-1 pl-4 flex items-center">
            For Event: <Link href={`/events/${qr.event.id}`} className="font-medium text-indigo-600 hover:underline mx-1">{qr.event.title}</Link> 
            ({formatDate(qr.event.eventDate)})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {qr.status === "open" && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200">Open for Bidding</span>}
          {qr.status === "closed" && <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200">Closed</span>}
          {qr.status === "awarded" && <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200"><CheckCircle className="h-4 w-4 inline mr-1" /> Awarded</span>}
          
          {isAdminOrDean && qr.status === "open" && (
            <button onClick={handleClose} disabled={actionLoading} className="btn-secondary text-red-600 hover:bg-red-50 border-red-200">
              Close Request
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-4 mb-4">Requirement Details</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Category</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100">
                  {VENDOR_CATEGORY_LABELS[qr.category]}
                </span>
              </div>
              
              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Deadline</span>
                <span className={`font-medium ${qr.isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                  {qr.deadline ? formatDate(qr.deadline) : "N/A"}
                  {qr.isExpired && " (Expired)"}
                </span>
              </div>
              
              {qr.budgetLimit && (
                <div>
                  <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Max Budget Limit</span>
                  <span className="font-semibold text-slate-900">₹{Number(qr.budgetLimit).toLocaleString("en-IN")}</span>
                </div>
              )}

              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Description & Requirements</span>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {qr.requirements || qr.description || qr.resourceRequest.description || "No specific details provided."}
                </p>
                {qr.resourceRequest.quantity && (
                  <p className="text-slate-700 mt-2 font-medium">Quantity requested: {qr.resourceRequest.quantity}</p>
                )}
              </div>
            </div>
          </div>
          
          {qr.status === "awarded" && qr.awardedTo && isAdminOrDean && (
             <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
               <h3 className="text-lg font-semibold text-green-900 border-b border-green-200 pb-4 mb-4 flex items-center">
                 <CheckCircle className="h-5 w-5 mr-2" /> Awarded Vendor
               </h3>
               <div className="space-y-3">
                 <p className="font-bold text-gray-900 text-lg">{qr.awardedTo.companyName}</p>
                 <p className="text-sm text-gray-700"><UserCircle className="inline h-4 w-4 mr-1 text-gray-500"/> {qr.awardedTo.contactPerson}</p>
                 <p className="text-sm text-gray-700"><Phone className="inline h-4 w-4 mr-1 text-gray-500"/> {qr.awardedTo.phone}</p>
                 <Link href={`/vendors/${qr.awardedTo.id}`} className="text-sm font-medium text-green-700 hover:underline inline-block mt-2">
                   View Full Profile →
                 </Link>
               </div>
             </div>
          )}
        </div>

        {/* Right Column: Bids / Submission Form */}
        <div className="lg:col-span-2">
          {isAdminOrDean ? (
            /* Admin View - Comparison Table */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <ReceiptText className="h-5 w-5 mr-2 text-indigo-600" /> 
                  Comparisons & Bids ({qr.quotationCount})
                </h3>
              </div>
              
              {qr.quotationCount === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
                  <p>No vendors have submitted quotations yet.</p>
                  {qr.isExpired && <p className="text-red-500 mt-2 text-sm">The deadline has passed without any bids.</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {qr.quotations.map((quote) => {
                        const isOverBudget = qr.budgetLimit && Number(quote.amount) > Number(qr.budgetLimit);
                        const isWinner = quote.id === qr.vendorBill?.quotationId;
                        return (
                          <tr key={quote.id} className={isWinner ? "bg-green-50" : "hover:bg-slate-50"}>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 flex items-center">
                                {quote.vendor.companyName}
                                {isWinner && <CheckCircle className="h-4 w-4 text-green-600 ml-2" />}
                              </div>
                              <div className="text-xs text-slate-500">Rating: ★{Number(quote.vendor.rating || 0).toFixed(1)} | {quote.vendor.totalOrders} past orders</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-slate-900'}`}>
                                ₹{Number(quote.amount).toLocaleString("en-IN")}
                              </div>
                              {isOverBudget && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium ml-1">Over Budget</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">
                              {quote.deliveryTimeline || "Not specified"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {quote.attachments.length > 0 ? (
                                <a href={quote.attachments[0].fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                                  <FileText className="h-3 w-3 mr-1" /> View PDF
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {qr.status === "open" ? (
                                <button 
                                  onClick={() => { setSelectedVendorId(quote.vendorId); setShowAwardModal(true); }}
                                  className="btn-primary py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 font-medium"
                                >
                                  Award Vendor
                                </button>
                              ) : isWinner ? (
                                <span className="font-medium text-green-600 flex items-center justify-end"><CheckCircle className="h-4 w-4 mr-1"/> Selected</span>
                              ) : (
                                <span className="text-slate-400">Not selected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : isVendor && (
            /* Vendor View - Submit Quote Form */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 bg-indigo-50/50 rounded-t-xl">
                 <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                   <ReceiptText className="h-5 w-5 mr-2 text-indigo-600" /> 
                   {qr.quotations.length > 0 ? "Update Your Quotation" : "Submit Your Quotation"}
                 </h3>
                 <p className="text-sm text-slate-600 mt-1">Provide your best price and details for this requirement.</p>
              </div>
              <div className="p-6">
                 {qr.status !== "open" ? (
                    <div className={`p-4 rounded-lg border ${qr.status === 'awarded' && qr.awardedTo?.id === user?.vendorId ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      {qr.status === 'awarded' && qr.awardedTo?.id === user?.vendorId 
                        ? <span className="flex items-center font-semibold"><CheckCircle className="h-5 w-5 mr-2" /> Congratulations! You were awarded this contract.</span> 
                        : "This request is closed or has been awarded to another vendor. You can no longer submit quotations."}
                    </div>
                 ) : qr.isExpired ? (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 font-medium flex items-center">
                       <AlertTriangle className="h-5 w-5 mr-2" /> The deadline for submissions has passed.
                    </div>
                 ) : (
                   <form onSubmit={(e) => { e.preventDefault(); /* Would trigger API call in real app */ alert('Submit Quote API integration mapped to /api/quotation-requests/[id]/quotations'); }}>
                      <div className="space-y-5">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Total Price Quote (₹) *</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee className="h-4 w-4 text-slate-400" />
                              </div>
                              <input type="number" required min="1" step="0.01" className="pl-10 block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 5000" />
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                               <label className="block text-sm font-medium text-slate-700">Delivery / Setup Timeline *</label>
                               <input type="text" required className="mt-1 block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 2 days before event" />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-slate-700">Valid Until (Optional)</label>
                               <input type="date" className="mt-1 block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Detailed Description / Inclusions</label>
                            <textarea rows={4} className="mt-1 block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="List exactly what is included in this price..." />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Attach Detailed Proposal (PDF)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <div className="flex text-sm text-slate-600 justify-center">
                                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF up to 10MB</p>
                              </div>
                            </div>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-200">
                            <button type="submit" className="w-full btn-primary flex justify-center py-2.5">
                              {qr.quotations.length > 0 ? "Update Quotation" : "Submit Quotation"}
                            </button>
                         </div>
                      </div>
                   </form>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Award Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Award Vendor Contract</h3>
            <p className="text-sm text-slate-600 mb-4">
              You are about to award this request to the selected vendor. A bill will automatically be sent to the Finance department for payment processing, and other vendors will be notified of rejection.
            </p>
            
            <label className="block text-sm font-medium text-slate-700 mb-1">Award Comment / Notes (Optional)</label>
            <textarea
              value={awardComment}
              onChange={(e) => setAwardComment(e.target.value)}
              className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-6"
              rows={3}
              placeholder="e.g., Selected due to fastest delivery timeline despite slightly higher cost."
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setShowAwardModal(false); setSelectedVendorId(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAward}
                disabled={actionLoading}
                className="btn-primary bg-indigo-600 hover:bg-indigo-700"
              >
                {actionLoading ? "Processing..." : "Confirm Award"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
