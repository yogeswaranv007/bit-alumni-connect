import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Building,
  Heart
} from 'lucide-react';
import { alumniAssociationInfo } from '../../data/alumniData';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 selection:bg-gold-500 selection:text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo/BIT_logo.jpg"
                  alt="BIT Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/cropped-bit_logo.png";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                  BIT <span className="text-gold-400">Connect</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Alumni Association • AABIT
                </span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              The official centralized Alumni Community and Engagement Platform of Bannari Amman Institute of Technology, uniting over 33,000 graduates across the globe.
            </p>

            <div className="space-y-2 text-xs text-slate-400 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                <span>Alathukombai Post, Sathyamangalam - 638 401, Erode District, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <a href="mailto:alumni@bitsathy.ac.in" className="text-slate-300 hover:text-gold-400 transition-colors">
                  alumni@bitsathy.ac.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span>Intercom: 04295 226124 | Phone: +91 4295 226000</span>
              </div>
            </div>
          </div>

          {/* Column 2: Community & Association */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              Community Hub
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/alumni-association" className="hover:text-gold-400 transition-colors">
                  Alumni Association (AABIT)
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-gold-400 transition-colors">
                  Alumni Directory
                </Link>
              </li>
              <li>
                <Link to="/chapters" className="hover:text-gold-400 transition-colors">
                  Global Chapters (15 Hubs)
                </Link>
              </li>
              <li>
                <Link to="/distinguished-alumni" className="hover:text-gold-400 transition-colors">
                  Distinguished Alumni
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-gold-400 transition-colors font-semibold text-gold-400">
                  Register as Alumni
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Activities & Media */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              Activities & Media
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/events" className="hover:text-gold-400 transition-colors">
                  Events & Reunions
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-gold-400 transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link to="/newsletter" className="hover:text-gold-400 transition-colors">
                  Newsletter Archive
                </Link>
              </li>
              <li>
                <Link to="/graduation-registration" className="hover:text-gold-400 transition-colors">
                  Graduation Convocation
                </Link>
              </li>
              <li>
                <Link to="/resources" className="hover:text-gold-400 transition-colors">
                  Official Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              Institutional Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.bitsathy.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Official BIT Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://bitsathy.directverify.in/myeasydocs_new/student/index.html#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Genuineness Verification</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://bittbi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Technology Incubator (TBI)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://forms.gle/CZrqndUDenTMBjzz5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>NBA Alumni Survey Form</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Bannari Amman Institute of Technology (BIT). All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Tagline: <strong className="text-gold-400">Stay Ahead</strong></span>
            <span>•</span>
            <span className="text-slate-400">BIT Connect Alumni Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
