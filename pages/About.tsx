
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Heart,
  Sparkles,
  Lock,
  Award,
  Clock,
  Star,
  CheckCircle,
  Users,
  BookOpen,
  Package,
  Truck,
  Download,
  Printer
} from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-softPink via-white to-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 text-6xl animate-pulse">✨</div>
          <div className="absolute top-40 right-20 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🌟</div>
          <div className="absolute bottom-20 left-1/4 text-5xl animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-primary mb-6 shadow-sm">
            <Award className="w-4 h-4" />
            Trusted by Families Worldwide
          </div>
          <h1 className="text-5xl md:text-6xl font-heading mb-6 text-gray-900">
            Every Child Deserves to Be a <span className="text-primary">Hero</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            We create personalized storybooks that transform your child into the hero of their own adventure.
            Every book is unique, safe, and crafted with love.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">100% Safe</span>
              <span className="text-xs text-gray-500">Photos auto-deleted</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Lock className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Bank-Level Security</span>
              <span className="text-xs text-gray-500">256-bit encryption</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Clock className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Fast Delivery</span>
              <span className="text-xs text-gray-500">Digital instant, print ships in days</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Heart className="w-8 h-8 text-pink-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Made with Love</span>
              <span className="text-xs text-gray-500">By parents, for parents</span>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading text-gray-900 mb-4">Our Promise to You</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We understand that nothing is more precious than your child. That's why we've built
            StoryGift with the highest standards of safety, quality, and care.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-heading text-gray-900 mb-3">Privacy Guaranteed</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Photos are never shared or sold
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Automatically deleted after 7 days
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                No facial recognition databases
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Built with privacy in mind
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-heading text-gray-900 mb-3">Premium Quality</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                State-of-the-art AI technology
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                Professional-grade illustrations
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                Engaging, age-appropriate stories
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                Digital PDF + printed book available
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-heading text-gray-900 mb-3">100% Satisfaction</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                Preview before you buy
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                30-day money-back guarantee
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                Unlimited re-downloads + print option
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                Friendly customer support
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Personalization Matters */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-xs font-semibold text-primary mb-4">
                <BookOpen className="w-3 h-3" />
                THE SCIENCE
              </div>
              <h2 className="text-4xl font-heading text-gray-900 mb-6 leading-tight">
                Why Personalized Stories<br />
                <span className="text-primary">Transform</span> Reading
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Research shows that children who see themselves in stories develop stronger
                self-esteem, better reading comprehension, and a lifelong love of books.
                When your child is the hero, every page becomes an adventure.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="text-3xl font-heading text-primary mb-1">More</div>
                  <div className="text-sm text-gray-600">Engaged reading</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="text-3xl font-heading text-secondary mb-1">Again!</div>
                  <div className="text-sm text-gray-600">Kids ask to read it</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[3rem] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">📚</div>
                  <p className="text-gray-600 font-medium">Every child deserves<br />to be a hero</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">👧</div>
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs">👦</div>
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs">👧</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Loved by</div>
                    <div className="text-xs text-gray-500">Happy families</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping & Delivery Timeline */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-xs font-semibold text-primary mb-4">
              <Truck className="w-3 h-3" />
              DELIVERY INFO
            </div>
            <h2 className="text-4xl font-heading text-gray-900 mb-4">Shipping & Delivery</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you choose digital or printed, we make sure your magical storybook reaches you as quickly as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Digital Delivery */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Download className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-heading text-gray-900 mb-2">Digital PDF</h3>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Clock className="w-3.5 h-3.5" />
                Instant Download
              </div>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  Ready within 2-3 minutes after payment
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  Download link sent to your email
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  Unlimited re-downloads for 30 days
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  Print at home or any print shop
                </li>
              </ul>
            </div>

            {/* Printed Book Delivery */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Package className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-heading text-gray-900 mb-2">Printed Book</h3>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Truck className="w-3.5 h-3.5" />
                Ships Worldwide
              </div>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <span><strong>Printing:</strong> 3-5 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <span><strong>Shipping to India:</strong> 5-10 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <span><strong>International:</strong> 10-20 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  Tracking number provided once shipped
                </li>
              </ul>
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-3xl mx-auto">
            <h4 className="text-lg font-heading text-gray-900 mb-6 text-center">Printed Book Journey</h4>
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 -z-10" />
              <div className="absolute top-5 left-0 w-3/4 h-1 bg-gradient-to-r from-primary to-purple-500 -z-10" />

              {/* Steps */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mb-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Order Placed</span>
                <span className="text-xs text-gray-400">Day 0</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mb-2">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Printing</span>
                <span className="text-xs text-gray-400">Days 1-5</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Shipped</span>
                <span className="text-xs text-gray-400">Day 5-6</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-2">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Delivered</span>
                <span className="text-xs text-gray-400">Days 10-15</span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              * Delivery times are estimates and may vary by location. Track your order in "My Creations" → "Ordered" tab.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-heading mb-4">Ready to Create Magic?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Give your child the gift of seeing themselves as the hero of their own story.
            Start creating your personalized storybook today.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Create Your Story
          </Link>
          <p className="text-white/60 text-sm mt-4">Free preview • No credit card required</p>
        </div>
      </section>
    </div>
  );
};

export default About;
