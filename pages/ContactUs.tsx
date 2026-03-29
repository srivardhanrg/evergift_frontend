
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Sparkles, ArrowLeft } from 'lucide-react';

const ContactUs: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-softPink via-white to-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 text-6xl animate-pulse">✨</div>
          <div className="absolute top-40 right-20 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🌟</div>
          <div className="absolute bottom-20 left-1/4 text-5xl animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-primary mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            We're Here to Help
          </div>
          <h1 className="text-5xl md:text-6xl font-heading mb-6 text-gray-900">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Have a question? We'd love to hear from you. Our team is here to help make your storybook experience magical.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-heading text-gray-900 mb-8 text-center">Contact Information</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Choose the most convenient way to reach us
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Email Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-heading text-gray-900 mb-2">Email Us</h3>
              <a
                href="mailto:hello@juvilabs.com"
                className="text-lg font-semibold text-primary hover:text-purple-600 transition-colors block mb-3"
              >
                hello@juvilabs.com
              </a>
              <p className="text-gray-600 text-sm">
                Response within 24 hours
              </p>
            </div>

            {/* Phone Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Phone className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-heading text-gray-900 mb-2">Call Us</h3>
              <a
                href="tel:+17209738597"
                className="text-lg font-semibold text-secondary hover:text-blue-600 transition-colors block mb-3"
              >
                +1 720 973-8597
              </a>
              <p className="text-gray-600 text-sm">
                Mon-Fri, 9:00 AM - 6:00 PM IST
              </p>
            </div>

            {/* Business Address Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-gray-900 mb-2">Visit Us</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Juvi Labs LLC</strong><br />
                1940 Broadway<br />
                Suite 314C<br />
                Boulder, CO 80302, US
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Details Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-heading text-gray-900 mb-6 text-center">Business Information</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Legal Entity</p>
                <p className="text-gray-600">Juvi Labs LLC</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Established</p>
                <p className="text-gray-600">2026</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Primary Email</p>
                <p className="text-gray-600">
                  <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline">
                    hello@juvilabs.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Phone</p>
                <p className="text-gray-600">+1 720 973-8597</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Business Hours</p>
                <p className="text-gray-600">Monday - Friday<br />9:00 AM - 6:00 PM IST</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Weekend Support</p>
                <p className="text-gray-600">Email only</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Message */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading text-gray-900 mb-4">We're Here to Help</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Our dedicated support team typically responds within 24 hours. Whether you have questions about your order,
            need help creating a story, or want to learn more about our services, we're here for you.
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-pink-400 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Create Your Story
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold border border-gray-200 hover:shadow-md transition-all"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Back to Home Link */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
