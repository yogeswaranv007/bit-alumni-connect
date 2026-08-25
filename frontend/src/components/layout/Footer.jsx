import React from 'react';
import { GraduationCap, Heart, MapPin, Mail, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-bit-700 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                BIT <span className="text-bit-400">Connect</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The official centralized Alumni Management and Engagement Platform of Bannari Amman Institute of Technology, Sathyamangalam.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/directory" className="hover:text-bit-400 transition">
                  Alumni Directory
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-bit-400 transition">
                  Portal Login
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-bit-400 transition">
                  Alumni Registration
                </a>
              </li>
            </ul>
          </div>

          {/* Institution Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Campus Contact
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-bit-500 flex-shrink-0 mt-0.5" />
                <span>Sathyamangalam, Erode District, Tamil Nadu 638401</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-bit-500 flex-shrink-0" />
                <span>alumni@bitsathy.ac.in</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-bit-500 flex-shrink-0" />
                <span>www.bitsathy.ac.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Bannari Amman Institute of Technology. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Crafted for the BIT Alumni Community</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
