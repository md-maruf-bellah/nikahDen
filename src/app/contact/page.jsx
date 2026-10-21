"use client";
import { useState } from "react";
import Image from "next/image";
import { Smartphone, Mail, MapPin, Send, Loader2, CircleCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import coupleImg from "./../../../assets/contact/img.png";
import { contactApi, ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

const initialForm = { firstName: "", lastName: "", phone: "", email: "", message: "" };

export default function ContactSection() {
  const { t, isRTL } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [openedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.firstName.trim()) er.firstName = t("contact.errFirstName", "নামের প্রথম অংশ লিখুন");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = t("contact.errEmail", "সঠিক ই-মেইল লিখুন");
    if (form.message.trim().length < 10) er.message = t("contact.errMessage", "বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে");
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!validate()) return;
    setSending(true);
    try {
      const res = await contactApi.send({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        formElapsedMs: Date.now() - openedAt,
        website: honeypot,
      });
      if (res?.duplicate) {
        setSuccess(t("contact.pendingMsg", "আপনার আগের বার্তাটি এখনো পর্যালোচনাধীন — আমরা শিগগিরই যোগাযোগ করব।"));
      } else {
        setSuccess(t("contact.successMsg", "ধন্যবাদ! আপনার বার্তা পৌঁছেছে — আমরা দ্রুত যোগাযোগ করব।"));
      }
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "RATE_LIMITED"
          ? t("contact.errRateLimit", "একটু অপেক্ষা করে আবার চেষ্টা করুন — খুব বেশি অনুরোধ পাঠানো হয়েছে।")
          : err.message || t("common.error", "বার্তা পাঠানো যায়নি — আবার চেষ্টা করুন।")
      );
    } finally {
      setSending(false);
    }
  };

  const inputCls = (key) =>
    `input input-bordered w-full focus:border-[#ff6b6b] outline-none ${errors[key] ? "border-red-400" : ""}`;

  return (
    <div className="min-h-screen">
      {/* Top Header Section */}
      <div className="bg-[#ff6b6b] text-white text-center py-10 px-4">
        <h1 className="text-3xl font-bold mb-2">{t("contact.title", "যোগাযোগ করুন")}</h1>
        <p className="text-sm opacity-90 flex justify-center gap-2 items-center">
          <Link href="/" className="hover:underline">{t("nav.home", "হোম")}</Link> <span className="opacity-60">/</span> {t("contact.breadcrumb", "যোগাযোগ")}
        </p>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 -mt-10 mb-20">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 pt-20">
          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 cursor-pointer transition-colors">
              <Smartphone className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="font-medium text-lg" dir="ltr">{t("footer.phone", "+৮৮০ ১৭০০০০০০০০")}</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 cursor-pointer transition-colors">
              <Mail className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="font-medium text-lg">{t("footer.email", "support@nikahdeen.com")}</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 cursor-pointer transition-colors">
              <MapPin className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="font-medium text-lg leading-relaxed">
              {t("footer.address", "ঢাকা, বাংলাদেশ")}
            </p>
          </div>
        </div>

        {/* Form and Image Section */}
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Image Section */}
            <div className="relative h-[400px] md:h-[600px] w-full">
              <Image src={coupleImg} alt="couple" fill className="object-cover" />
            </div>

            {/* Form Section */}
            <div className="p-7 md:p-10 flex flex-col justify-center bg-base-200">
              {success && (
                <div className="alert alert-success text-sm mb-4 py-2">
                  <CircleCheck size={16} /> <span>{success}</span>
                </div>
              )}
              {error && (
                <div className="alert alert-error text-sm mb-4 py-2">
                  <AlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} noValidate className="space-y-6">
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-gray-500 text-xs">{t("contact.firstName", "নামের প্রথম অংশ")} *</span>
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set("firstName")}
                      placeholder="Mr. XXXXX"
                      className={inputCls("firstName")}
                    />
                    {errors.firstName && <span className="text-red-500 text-xs mt-1">{errors.firstName}</span>}
                  </div>
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-gray-500 text-xs">{t("contact.lastName", "নামের শেষ অংশ")}</span>
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set("lastName")}
                      placeholder="XXXXX"
                      className={inputCls("lastName")}
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">{t("contact.phone", "ফোন")}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+৮৮০ ১৭ XXXX XXXX"
                      className={inputCls("phone")}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">{t("contact.email", "ই-মেইল")} *</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="xxx@example.com"
                    className={inputCls("email")}
                  />
                  {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
                </div>

                {/* Message Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">{t("contact.message", "আপনার বার্তা")} *</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    className={`textarea w-full textarea-bordered h-32 focus:border-[#ff6b6b] outline-none ${errors.message ? "border-red-400" : ""}`}
                    placeholder={t("contact.messagePlaceholder", "আপনার বার্তা বিস্তারিত লিখুন...")}
                  />
                  {errors.message && <span className="text-red-500 text-xs mt-1">{errors.message}</span>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={sending}
                  className="btn bg-[#f2504d] hover:bg-[#d43f3c] text-white border-none w-full text-lg font-bold h-12 mt-4"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className={isRTL ? "rotate-180" : ""} />}
                  {sending ? t("contact.submitting", "পাঠানো হচ্ছে...") : t("contact.submitBtn", "সাবমিট করুন")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
