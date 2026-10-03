'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/compat/Link';
import Image from '@/compat/Image';

const AUTOPLAY_INTERVAL = 5000; // 10 seconds per slide as requested

const slidesData = [
    {
        id: 1,
        title: "Find your perfect",
        highlight: "wedding venue",
        description: "Explore hand-picked venues that match your style, budget, and guest count. From heritage palaces to modern banquet halls.",
        primaryCta: { text: "Explore Venues", link: "/categories/venues" },
        secondaryCta: { text: "View Packages", link: "/packages" },
        image: "/images/hero/slide-1.jpg",
        eyebrow: "Weddings, made effortless"
    },
    {
        id: 2,
        title: "Expert planners,",
        highlight: "seamless execution",
        description: "Award-winning wedding planners & designers who bring your vision to life. End-to-end coordination, decor, and more.",
        primaryCta: { text: "Find a Planner", link: "/categories/planning-decor" },
        secondaryCta: { text: "See Success Stories", link: "/stories" },
        image: "/images/hero/slide-2.jpg",
        eyebrow: "Plan with perfection"
    },
    {
        id: 3,
        title: "Stunning decor,",
        highlight: "unforgettable moments",
        description: "Magical home wedding setups, floral arrangements, and thematic decor that leave your guests in awe.",
        primaryCta: { text: "Browse Decor", link: "/categories/home-setup-pandal-tent-dj" },
        secondaryCta: { text: "Get Inspired", link: "/gallery" },
        image: "/images/hero/slide-3.jpg",
        eyebrow: "Decor that dazzles"
    }
];

const HeroSlideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const autoplayRef = useRef(null);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const totalSlides = slidesData.length;

    const resetTimer = useCallback(() => {
        if (autoplayRef.current) {
            clearInterval(autoplayRef.current);
        }
        autoplayRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides);
        }, AUTOPLAY_INTERVAL);
    }, [totalSlides]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
        resetTimer();
    }, [totalSlides, resetTimer]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
        resetTimer();
    }, [totalSlides, resetTimer]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
        resetTimer();
    };

    // Autoplay logic: change every 10 seconds automatically
    useEffect(() => {
        resetTimer();
        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [resetTimer]);

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current !== null && touchEndX.current !== null) {
            const diff = touchStartX.current - touchEndX.current;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToNext();
                } else {
                    goToPrev();
                }
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                goToPrev();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);

    return (
        <section
            className="hero-slideshow"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slides container */}
            <div
                className="slides-container"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {slidesData.map((slide) => (
                    <div key={slide.id} className="slide">
                        {/* Background image with overlay */}
                        <div className="slide-bg">
                            <Image
                                src={slide.image}
                                alt={slide.eyebrow}
                                fill
                                sizes="100vw"
                                style={{ objectFit: 'cover' }}
                                loading={slide.id === 1 ? "eager" : "lazy"}
                                fetchPriority={slide.id === 1 ? "high" : "low"}
                                quality={85}
                            />
                        </div>
                        <div className="slide-overlay" />

                        {/* Content container */}
                        <div className="container slide-content">
                            <div className="slide-text">
                                <span className="eyebrow">{slide.eyebrow}</span>
                                <h1>
                                    {slide.title} <span>{slide.highlight}</span>
                                </h1>
                                <p>{slide.description}</p>
                                {/* CTA Buttons */}
                                <div className="slide-cta">
                                    <Link href={slide.primaryCta.link} className="btn btn-primary">
                                        {slide.primaryCta.text}
                                    </Link>
                                    <Link href={slide.secondaryCta.link} className="btn btn-outline-light">
                                        {slide.secondaryCta.text}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                type="button"
                className="slider-arrow prev"
                onClick={goToPrev}
                aria-label="Previous slide"
            >
                &#x2039;
            </button>
            <button
                type="button"
                className="slider-arrow next"
                onClick={goToNext}
                aria-label="Next slide"
            >
                &#x203A;
            </button>

            {/* Dots indicator */}
            <div className="slider-dots">
                {slidesData.map((_, idx) => (
                    <button
                        type="button"
                        key={idx}
                        className={`dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlideshow;