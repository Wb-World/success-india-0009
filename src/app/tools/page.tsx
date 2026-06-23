'use client';

import { useState } from 'react';
import { UtensilsCrossed, Star, MapPin, Clock, ExternalLink } from 'lucide-react';

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  hours: string;
  image: string;
  tag: string;
  tagColor: string;
};

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: 'The Grand Spice Kitchen',
    cuisine: 'South Indian Fine Dining',
    location: 'Chromepet, Chennai',
    rating: 4.8,
    hours: '11:00 AM – 11:00 PM',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    tag: 'Premium',
    tagColor: '#f59e0b',
  },
  {
    id: 2,
    name: 'Spice Route Bistro',
    cuisine: 'Multi-Cuisine',
    location: 'Tambaram, Chennai',
    rating: 4.6,
    hours: '12:00 PM – 10:30 PM',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    tag: 'Popular',
    tagColor: '#10b981',
  },
  {
    id: 3,
    name: 'Aromas of Tamil Nadu',
    cuisine: 'Traditional Tamil',
    location: 'Pallavaram, Chennai',
    rating: 4.9,
    hours: '7:00 AM – 10:00 PM',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    tag: 'Top Rated',
    tagColor: '#8b5cf6',
  },
  {
    id: 4,
    name: 'Leaf & Ladle',
    cuisine: 'Healthy & Organic',
    location: 'South Chennai',
    rating: 4.5,
    hours: '9:00 AM – 9:00 PM',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    tag: 'Healthy',
    tagColor: '#22c55e',
  },
  {
    id: 5,
    name: 'Heritage Dhaba',
    cuisine: 'North Indian',
    location: 'Chennai Central',
    rating: 4.7,
    hours: '11:00 AM – 11:30 PM',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    tag: 'Heritage',
    tagColor: '#f97316',
  },
  {
    id: 6,
    name: 'Coastal Crave',
    cuisine: 'Seafood Speciality',
    location: 'Tambaram, Chennai',
    rating: 4.6,
    hours: '12:00 PM – 11:00 PM',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    tag: 'Seafood',
    tagColor: '#0ea5e9',
  },
];

export default function ToolsPage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <div className="tools-page">
      {/* Hero Header */}
      <section className="tools-hero">
        <div className="tools-hero-inner">
          <div className="tools-hero-icon">
            <UtensilsCrossed size={36} />
          </div>
          <span className="tools-eyebrow">Recommended Partners</span>
          <h1 className="tools-hero-title">Our Featured Restaurants</h1>
          <p className="tools-hero-sub">
            Discover handpicked dining destinations trusted by the Success Team community — exceptional food, warm ambience, and memorable experiences.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="tools-gallery-section container">
        <div className="tools-gallery-grid">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className={`resto-card ${activeCard === r.id ? 'resto-card-active' : ''}`}
              onMouseEnter={() => setActiveCard(r.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              {/* Image */}
              <div className="resto-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt={r.name} className="resto-img" />
                <div className="resto-img-overlay" />
                <span
                  className="resto-tag"
                  style={{ background: r.tagColor }}
                >
                  {r.tag}
                </span>
                <div className="resto-rating-badge">
                  <Star size={12} fill="#fbbf24" stroke="none" />
                  <span>{r.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="resto-info">
                <h3 className="resto-name">{r.name}</h3>
                <p className="resto-cuisine">
                  <UtensilsCrossed size={12} style={{ flexShrink: 0 }} />
                  {r.cuisine}
                </p>
                <div className="resto-meta">
                  <span className="resto-meta-item">
                    <MapPin size={12} />
                    {r.location}
                  </span>
                  <span className="resto-meta-item">
                    <Clock size={12} />
                    {r.hours}
                  </span>
                </div>
                <div className="resto-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(r.rating) ? '#f59e0b' : 'none'}
                      stroke={i < Math.floor(r.rating) ? '#f59e0b' : '#d1d5db'}
                    />
                  ))}
                  <span className="resto-review-count">({r.rating})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .tools-page {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 5rem;
        }

        /* Hero */
        .tools-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c2e 100%);
          padding: 5rem 1.5rem 6.5rem;
          position: relative;
          overflow: hidden;
          color: white;
          text-align: center;
        }

        .tools-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }

        .tools-hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 90px;
          background: linear-gradient(180deg, transparent, #f8fafc);
          pointer-events: none;
        }

        .tools-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 680px;
          margin: 0 auto;
        }

        .tools-hero-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 76px;
          height: 76px;
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 22px;
          color: #fbbf24;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .tools-eyebrow {
          display: inline-block;
          color: #86efac;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }

        .tools-hero-title {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 800;
          color: white;
          margin: 0 0 1rem;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .tools-hero-sub {
          font-size: 1.02rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.75;
          margin: 0;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Gallery */
        .tools-gallery-section {
          padding: 3.5rem 1.5rem;
          max-width: 1280px;
          margin: 0 auto;
        }

        .tools-gallery-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 600px) {
          .tools-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 960px) {
          .tools-gallery-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Restaurant Card */
        .resto-card {
          background: white;
          border-radius: 22px;
          overflow: hidden;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }

        .resto-card:hover,
        .resto-card-active {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.12);
          border-color: #10b981;
        }

        /* Image */
        .resto-img-wrap {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .resto-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .resto-card:hover .resto-img {
          transform: scale(1.07);
        }

        .resto-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%);
        }

        .resto-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        .resto-rating-badge {
          position: absolute;
          bottom: 14px;
          right: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.92);
          color: #92400e;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(8px);
        }

        /* Info */
        .resto-info {
          padding: 1.4rem 1.5rem 1.6rem;
        }

        .resto-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.4rem;
          line-height: 1.3;
        }

        .resto-cuisine {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #10b981;
          font-weight: 700;
          margin: 0 0 0.85rem;
        }

        .resto-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }

        .resto-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #6b7280;
          font-weight: 500;
        }

        .resto-stars {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .resto-review-count {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          margin-left: 4px;
        }

        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
