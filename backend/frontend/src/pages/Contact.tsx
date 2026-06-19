import {
  CheckCircle,
  Clock4,
  Facebook,
  Instagram,
  Loader,
  Mail,
  MapPin,
  Phone,
  Send,
  Twitter,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";
import api from "../lib/axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const { data } = await api.post("/contact", formData);
      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl">
          Parlons de votre voyage
        </h2>
        <p className="max-w-lg mx-auto text-black/60 mt-3">
          Notre équipe est disponible 7j/7 pour répondre à vos questions sur
          nos trajets interurbains à Madagascar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-5 space-y-5">
            <div className="flex gap-3">
              <div className="bg-white size-10 p-1 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <MapPin strokeWidth={1.5} className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Siège Social</h3>
                <p className="text-black/60 text-sm">
                  Behoririka, Antananarivo 101, Madagascar
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white size-10 p-1 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <Phone strokeWidth={1.5} className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Téléphone</h3>
                <p className="text-black/60 text-sm">+261 34 00 000 00</p>
                <p className="text-black/60 text-sm">+261 34 00 000 00</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white size-10 p-1 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <Mail strokeWidth={1.5} className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Email</h3>
                <p className="text-black/60 text-sm">contact@cotramplus.mg</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white size-10 p-1 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <Clock4 strokeWidth={1.5} className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Heures d'ouverture</h3>
                <p className="text-black/60 text-sm">Lundi - Dimanche</p>
                <p className="text-black/60 text-sm">05:00 - 18:00</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-3">Suivez-nous</h3>
            <div className="flex gap-2">
              <Link
                to="https://www.facebook.com/p/Cotram-Plus-100091759827149/"
                target="_blank"
                className="bg-white size-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-primary hover:border-primary border border-gray-100 transition-colors"
              >
                <Facebook size={16} />
              </Link>
              <Link
                to="https://www.facebook.com/p/Cotram-Plus-100091759827149/"
                target="_blank"
                className="bg-white size-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-primary hover:border-primary border border-gray-100 transition-colors"
              >
                <Instagram size={16} />
              </Link>
              <Link
                to=""
                className="bg-white size-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-primary hover:border-primary border border-gray-100 transition-colors"
              >
                <Twitter size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-1">Envoyez-nous un message</h3>
            <p className="text-gray-400 text-sm mb-6">
              Nous vous répondrons dans les plus brefs délais.
            </p>

            {status === "success" && (
              <div className="flex gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                <CheckCircle
                  size={16}
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm text-emerald-700 font-medium">
                    Message envoyé !
                  </p>
                  <p className="text-xs text-emerald-600">
                    Nous vous répondrons rapidement.
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">
                  Erreur lors de l'envoi. Veuillez réessayer.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Sujet
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Objet de votre message"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Message *
                </label>
                <textarea
                  className={`${inputClass} min-h-[140px] resize-none`}
                  placeholder="Décrivez votre demande..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={15} />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Contact;
