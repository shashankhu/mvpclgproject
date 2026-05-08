"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, VENDOR_DOC_TYPES, VENDOR_DOC_TYPE_LABELS } from "@/lib/constants";
import { Building2, UserCircle, Phone, Mail, MapPin, CheckCircle, UploadCloud, Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";

export default function VendorRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    categories: [],
    description: "",
  });

  const [documents, setDocuments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const isSelected = prev.categories.includes(category);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter((c) => c !== category) };
      } else {
        if (prev.categories.length >= 5) return prev; // max 5
        return { ...prev, categories: [...prev.categories, category] };
      }
    });
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    // In a real app, we'd upload directly to `/api/upload` here and get the URL back.
    // However, to keep registration simple and atomic, we might need a separate endpoint
    // or we'll just mock the file input as being attached to formData for multipart submission
    // Let's implement the standard approach: Upload first, then attach the ID to registration.
    
    // For this boilerplate, we'll store the File objects in state and upload them as multipart 
    // OR just use our /api/upload endpoint right now.
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!formData.companyName || !formData.contactPerson || !formData.phone || !formData.email || !formData.password) {
        setError("Please fill all required fields in the first step.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.categories.length === 0) {
        setError("Please select at least one service category.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real scenario with files, you'd upload files via /api/upload first and get URLs/IDs.
      // Assuming no docs attached for a basic test:
      
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccessMsg(data.message);
      setStep(4); // Success view
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "600px", width: "100%", padding: "var(--space-8)" }}>
        <div className="auth-logo" style={{ marginBottom: "var(--space-6)" }}>
          <h1>DIGANTA</h1>
          <p>Partner Registration Portal</p>
        </div>

        {step < 4 && (
          <div style={{ marginBottom: "var(--space-8)", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, background: "var(--border-default)", zIndex: 0 }} />
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ 
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: step >= s ? "var(--accent-primary)" : "var(--bg-elevated)", color: step >= s ? "var(--text-inverse)" : "var(--text-muted)",
                  fontWeight: 600, fontSize: "var(--text-sm)", border: `2px solid ${step >= s ? "var(--accent-primary)" : "var(--border-default)"}`
                }}>
                  {s}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-2)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              <span>Company</span>
              <span>Categories</span>
              <span>Submit</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "var(--space-3)", background: "var(--accent-danger-bg)", color: "var(--accent-danger-text)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-6)", fontSize: "var(--text-sm)" }}>
            {error}
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company Name *</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="form-input" style={{ paddingLeft: 40 }} placeholder="Acme Services Pvt Ltd" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Person *</label>
                  <div style={{ position: "relative" }}>
                    <UserCircle size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="form-input" style={{ paddingLeft: 40 }} placeholder="John Doe" />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input type="tel" name="phone" required pattern="[0-9]{10}" value={formData.phone} onChange={handleChange} className="form-input" style={{ paddingLeft: 40 }} placeholder="9876543210" />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address *</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-input" style={{ paddingLeft: 40 }} placeholder="john@example.com" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} name="password" required minLength={8} value={formData.password} onChange={handleChange} className="form-input" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              <div>
                <label className="form-label" style={{ marginBottom: "var(--space-3)" }}>Select your service categories * (Max 5)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  {VENDOR_CATEGORIES.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                      <div key={cat} onClick={() => handleCategoryToggle(cat)}
                        style={{
                          cursor: "pointer", padding: "var(--space-3)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "var(--space-2)",
                          border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`,
                          background: isSelected ? "var(--accent-primary-light)" : "var(--bg-surface)",
                          transition: "all var(--transition-fast)"
                        }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                          border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`,
                          background: isSelected ? "var(--accent-primary)" : "var(--bg-surface)", color: "var(--text-inverse)"
                        }}>
                          {isSelected && <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </div>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: isSelected ? 600 : 500, color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                          {VENDOR_CATEGORY_LABELS[cat]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">GST Number (Optional)</label>
                  <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="form-input" placeholder="15 alphanumeric chars" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PAN Number (Optional)</label>
                  <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="form-input" placeholder="10 alphanumeric chars" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              <div style={{ padding: "var(--space-4)", background: "var(--accent-warning-bg)", borderRadius: "var(--radius-md)", border: "1px solid #FDE68A" }}>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--accent-warning-text)", marginBottom: "var(--space-1)" }}>Almost done!</h4>
                <p style={{ fontSize: "13px", color: "var(--accent-warning-text)", opacity: 0.9 }}>
                  Please review your details. After submission, your registration will be sent to the administration for verification.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", background: "var(--bg-muted)", padding: "var(--space-4)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 2 }}>Company Name</span>
                  <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{formData.companyName}</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 2 }}>Contact</span>
                  <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{formData.contactPerson} ({formData.phone})</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>Categories selected</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {formData.categories.map(c => (
                      <span key={c} className="badge badge-progress">
                        {VENDOR_CATEGORY_LABELS[c]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="empty-state">
              <div style={{ margin: "0 auto var(--space-4)", width: 64, height: 64, borderRadius: "50%", background: "var(--accent-success-bg)", color: "var(--accent-success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Registration Completed</h3>
              <p style={{ marginBottom: "var(--space-6)" }}>{successMsg || "Your application is under review."}</p>
              <Link href="/login" className="btn btn-primary btn-lg w-full">
                Go to Login
              </Link>
            </div>
          )}

          {step < 4 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-8)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-default)" }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">
                  Back
                </button>
              ) : (
                <Link href="/login" className="btn btn-ghost">
                  Cancel
                </Link>
              )}

              {step < 3 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? <Loader2 className="spinner" size={16} style={{ marginRight: 8 }} /> : null}
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {step < 4 && (
        <div className="auth-footer" style={{ marginTop: "var(--space-6)" }}>
          Already registered?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Log in to your account
          </Link>
        </div>
      )}
    </div>
  );
}
