'use client';

import { useState } from 'react';
import { UtensilsCrossed, Star, MapPin, Clock, Waves, Phone, Globe } from 'lucide-react';

type DishItem = {
  id: number;
  name: string;
  description: string;
  image: string;
  tag: string;
  tagColor: string;
  price: string;
  category: string;
};

const dishes: DishItem[] = [
  {
    id: 1,
    name: 'Grilled Coastal Seafood Platter',
    description: 'Fresh catch of the day — tiger prawns, pomfret & crab claws grilled over charcoal with coastal spices.',
    image: '/restaurents/image%20copy.png',
    tag: 'Chef\'s Special',
    tagColor: '#059669',
    price: '₹ 890',
    category: 'Seafood',
  },
  {
    id: 2,
    name: 'Beachside Biryani',
    description: 'Fragrant basmati rice slow-cooked with premium spices, served with raita and salan.',
    image: '/restaurents/image%20copy%202.png',
    tag: 'Bestseller',
    tagColor: '#d97706',
    price: '₹ 450',
    category: 'Rice & Biryani',
  },
  {
    id: 3,
    name: 'Sureni Crab Curry',
    description: 'Blue swimmer crabs simmered in a rich coconut-tomato gravy — a signature Suren Inn recipe.',
    image: '/restaurents/image%20copy%203.png',
    tag: 'Signature',
    tagColor: '#7c3aed',
    price: '₹ 720',
    category: 'Curries',
  },
  {
    id: 4,
    name: 'Tropical Grilled Chicken',
    description: 'Whole spring chicken marinated in tropical herbs, fire-grilled to perfection.',
    image: '/restaurents/image%20copy%204.png',
    tag: 'Grill Favourite',
    tagColor: '#dc2626',
    price: '₹ 560',
    category: 'Grills',
  },
  {
    id: 5,
    name: 'Fresh Fruit Paradise Bowl',
    description: 'Seasonal tropical fruits — mango, papaya, pineapple — drizzled with honey & fresh lime.',
    image: '/restaurents/image%20copy%205.png',
    tag: 'Healthy',
    tagColor: '#16a34a',
    price: '₹ 250',
    category: 'Desserts & Fruits',
  },
  {
    id: 6,
    name: 'Coastal Veg Thali',
    description: 'Complete South Indian thali — rice, sambar, rasam, 3 curries, papad, pickle & payasam.',
    image: '/restaurents/image%20copy%206.png',
    tag: 'Value Meal',
    tagColor: '#0891b2',
    price: '₹ 380',
    category: 'Thali',
  },
  {
    id: 7,
    name: 'Tandoor Naan & Dal Makhani',
    description: 'Buttery dal makhani slow-cooked overnight, paired with freshly baked garlic naan.',
    image: '/restaurents/image%20copy%207.png',
    tag: 'North Indian',
    tagColor: '#b45309',
    price: '₹ 340',
    category: 'North Indian',
  },
  {
    id: 8,
    name: 'Beach BBQ Fish Tikka',
    description: 'Seer fish cubes marinated in tikka masala, skewered & grilled on open flame.',
    image: '/restaurents/image%20copy%208.png',
    tag: 'Grilled',
    tagColor: '#c2410c',
    price: '₹ 620',
    category: 'Seafood',
  },
  {
    id: 9,
    name: 'Tender Coconut Payasam',
    description: 'Classic Kerala payasam made with fresh tender coconut, jaggery & cardamom.',
    image: '/restaurents/image%20copy%209.png',
    tag: 'Traditional',
    tagColor: '#065f46',
    price: '₹ 180',
    category: 'Desserts & Fruits',
  },
  {
    id: 10,
    name: 'Resort Grand Feast',
    description: 'Our lavish buffet spread with 20+ dishes including live counters, desserts & welcome drinks.',
    image: '/restaurents/image.png',
    tag: 'Grand Buffet',
    tagColor: '#1d4ed8',
    price: '₹ 1,200',
    category: 'Buffet',
  },
];

const categories = ['All', ...Array.from(new Set(dishes.map((d) => d.category)))];

export default function ToolsPage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? dishes : dishes.filter((d) => d.category === activeCategory);

  return (
    <div className="resort-page">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="resort-hero">
        <div className="resort-hero-bg" />
        <div className="resort-hero-inner">
          <div className="resort-logo-icon">
            <Waves size={32} />
          </div>
          <span className="resort-eyebrow">Beachfront Dining Experience</span>
          <h1 className="resort-hero-title">SUREN INN BEACH RESORT</h1>
          <p className="resort-hero-tagline">
            Restaurant &amp; Dining
          </p>
          <p className="resort-hero-sub">
            Savour the finest coastal cuisine crafted from locally sourced ingredients — where every meal is complemented by the sound of waves and the warmth of hospitality.
          </p>
          <div className="resort-hero-badges">
            <span className="resort-badge"><MapPin size={13} /> Beachfront Location</span>
            <span className="resort-badge"><Clock size={13} /> 7:00 AM – 11:00 PM</span>
            <span className="resort-badge"><Phone size={13} /> Reservations Open</span>
          </div>
        </div>
        <div className="resort-wave-divider">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f0fdf4" />
          </svg>
        </div>
      </section>

      {/* ── Category Filter ────────────────────────────────────── */}
      <section className="resort-filter-bar container">
        <div className="resort-filter-label">
          <UtensilsCrossed size={16} />
          <span>Explore Our Menu</span>
        </div>
        <div className="resort-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-tab ${activeCategory === cat ? 'filter-tab-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Dish Gallery ───────────────────────────────────────── */}
      <section className="resort-gallery container">
        <div className="resort-grid">
          {filtered.map((dish) => (
            <div
              key={dish.id}
              className={`dish-card ${activeCard === dish.id ? 'dish-card-active' : ''}`}
              onMouseEnter={() => setActiveCard(dish.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              {/* Image */}
              <div className="dish-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dish.image} alt={dish.name} className="dish-img" />
                <div className="dish-img-overlay" />
                <span className="dish-tag" style={{ background: dish.tagColor }}>{dish.tag}</span>
                <span className="dish-price-badge">{dish.price}</span>
              </div>

              {/* Info */}
              <div className="dish-info">
                <span className="dish-category-pill">{dish.category}</span>
                <h3 className="dish-name">{dish.name}</h3>
                <p className="dish-desc">{dish.description}</p>
                <div className="dish-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < 4 ? '#f59e0b' : 'none'}
                      stroke={i < 4 ? '#f59e0b' : '#d1d5db'}
                    />
                  ))}
                  <span className="dish-rating-txt">4.8</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Info Strip ────────────────────────────────────────── */}
      <section className="resort-info-strip container">
        <div className="info-strip-card">
          <div className="info-strip-icon"><MapPin size={22} /></div>
          <div>
            <div className="info-strip-label">Location</div>
            <div className="info-strip-value">Beachfront, East Coast Road</div>
          </div>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-card">
          <div className="info-strip-icon"><Clock size={22} /></div>
          <div>
            <div className="info-strip-label">Dining Hours</div>
            <div className="info-strip-value">7:00 AM – 11:00 PM Daily</div>
          </div>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-card">
          <div className="info-strip-icon"><Phone size={22} /></div>
          <div>
            <div className="info-strip-label">Reservations</div>
            <div className="info-strip-value">Call or Walk-in Welcome</div>
          </div>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-card">
          <div className="info-strip-icon"><Globe size={22} /></div>
          <div>
            <div className="info-strip-label">Cuisine</div>
            <div className="info-strip-value">South Indian · Coastal · Multi</div>
          </div>
        </div>
      </section>

      <style>{`
        /* ─── Page Base ─────────────────────────────────── */
        .resort-page {
          min-height: 100vh;
          background: #f0fdf4;
          padding-bottom: 5rem;
          font-family: 'Inter', 'Outfit', sans-serif;
        }

        /* ─── Hero ─────────────────────────────────────── */
        .resort-hero {
          position: relative;
          background: linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 65%, #047857 100%);
          padding: 5.5rem 1.5rem 7rem;
          text-align: center;
          overflow: hidden;
          color: white;
        }

        .resort-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.18) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(5,150,105,0.15) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }

        .resort-wave-divider {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          line-height: 0;
        }
        .resort-wave-divider svg {
          width: 100%;
          height: 80px;
          display: block;
        }

        .resort-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }

        .resort-logo-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          color: #6ee7b7;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
          animation: floatIcon 3s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .resort-eyebrow {
          display: inline-block;
          color: #6ee7b7;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.85rem;
          padding: 4px 14px;
          border: 1px solid rgba(110,231,183,0.3);
          border-radius: 999px;
          background: rgba(110,231,183,0.08);
        }

        .resort-hero-title {
          font-size: clamp(1.9rem, 5.5vw, 3.6rem);
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 0.4rem;
          line-height: 1.08;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 24px rgba(0,0,0,0.3);
        }

        .resort-hero-tagline {
          font-size: 1rem;
          font-weight: 600;
          color: #a7f3d0;
          margin: 0 0 1rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .resort-hero-sub {
          font-size: 1rem;
          color: rgba(255,255,255,0.76);
          line-height: 1.8;
          margin: 0 auto 1.75rem;
          max-width: 580px;
        }

        .resort-hero-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.6rem;
        }

        .resort-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          color: #d1fae5;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        /* ─── Filter Bar ────────────────────────────────── */
        .resort-filter-bar {
          padding: 2.5rem 1.5rem 0;
          max-width: 1280px;
          margin: 0 auto;
        }

        .resort-filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #059669;
          margin-bottom: 1rem;
        }

        .resort-filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filter-tab {
          background: white;
          border: 1.5px solid #d1fae5;
          color: #374151;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.45rem 1rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          border-color: #10b981;
          color: #059669;
          background: #ecfdf5;
        }

        .filter-tab-active {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          border-color: transparent !important;
          color: white !important;
          box-shadow: 0 4px 14px rgba(16,185,129,0.35);
        }

        /* ─── Gallery Grid ──────────────────────────────── */
        .resort-gallery {
          padding: 2.5rem 1.5rem 3rem;
          max-width: 1280px;
          margin: 0 auto;
        }

        .resort-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }

        @media (min-width: 600px) {
          .resort-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 960px) {
          .resort-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1200px) {
          .resort-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* ─── Dish Card ─────────────────────────────────── */
        .dish-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid #d1fae5;
          box-shadow: 0 4px 20px rgba(16,185,129,0.07);
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }

        .dish-card:hover,
        .dish-card-active {
          transform: translateY(-9px);
          box-shadow: 0 22px 50px rgba(16,185,129,0.16);
          border-color: #10b981;
        }

        .dish-img-wrap {
          position: relative;
          height: 210px;
          overflow: hidden;
        }

        .dish-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .dish-card:hover .dish-img {
          transform: scale(1.08);
        }

        .dish-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.52) 100%);
        }

        .dish-tag {
          position: absolute;
          top: 13px;
          left: 13px;
          color: white;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        .dish-price-badge {
          position: absolute;
          bottom: 13px;
          right: 13px;
          background: rgba(255,255,255,0.94);
          color: #065f46;
          font-size: 0.85rem;
          font-weight: 900;
          padding: 4px 11px;
          border-radius: 999px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        /* ─── Dish Info ─────────────────────────────────── */
        .dish-info {
          padding: 1.2rem 1.35rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .dish-category-pill {
          display: inline-block;
          background: #ecfdf5;
          color: #059669;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 2px 9px;
          border-radius: 999px;
          align-self: flex-start;
          border: 1px solid #a7f3d0;
        }

        .dish-name {
          font-size: 0.97rem;
          font-weight: 800;
          color: #111827;
          margin: 0;
          line-height: 1.35;
        }

        .dish-desc {
          font-size: 0.78rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .dish-stars {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 0.2rem;
        }

        .dish-rating-txt {
          font-size: 0.73rem;
          color: #9ca3af;
          font-weight: 600;
          margin-left: 5px;
        }

        /* ─── Info Strip ────────────────────────────────── */
        .resort-info-strip {
          margin: 0 auto 2rem;
          padding: 0 1.5rem;
          max-width: 1280px;
          background: white;
          border-radius: 20px;
          border: 1.5px solid #d1fae5;
          box-shadow: 0 4px 20px rgba(16,185,129,0.08);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0;
        }

        .info-strip-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.4rem 1.75rem;
          flex: 1;
          min-width: 180px;
        }

        .info-strip-icon {
          width: 44px;
          height: 44px;
          background: #ecfdf5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          flex-shrink: 0;
        }

        .info-strip-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9ca3af;
          margin-bottom: 2px;
        }

        .info-strip-value {
          font-size: 0.88rem;
          font-weight: 700;
          color: #111827;
        }

        .info-strip-divider {
          width: 1px;
          height: 48px;
          background: #d1fae5;
          flex-shrink: 0;
        }

        @media (max-width: 767px) {
          .info-strip-divider { display: none; }
          .info-strip-card { border-bottom: 1px solid #f0fdf4; }
          .resort-info-strip { flex-direction: column; align-items: stretch; gap: 0; }
        }

        .container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
