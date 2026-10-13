'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/compat/Link';
import Image from '@/compat/Image';

const AUTOPLAY_INTERVAL = 5000;

const slidesData = [
    {
        id: 1,
        title: "Find your perfect",
        highlight: "wedding venue",
        description: "Explore hand-picked venues that match your style, budget, and guest count. From heritage palaces to modern banquet halls.",
        primaryCta: { text: "Explore Venues", link: "/categories/venues" },
        secondaryCta: { text: "View Packages", link: "/categories" },
        image: "/images/hero/slide-1.jpg",
        eyebrow: "Weddings, made effortless"
    },
    {
        id: 2,
        title: "Expert planners,",
        highlight: "seamless execution",
        description: "Award-winning wedding planners & designers who bring your vision to life. End-to-end coordination, decor, and more.",
        primaryCta: { text: "Find a Planner", link: "/categories/planning-decor" },
        secondaryCta: { text: "See Services", link: "/categories" },
        image: "/images/hero/slide-2.jpg",
        eyebrow: "Plan with perfection"
    },
    {
        id: 3,
        title: "Stunning decor,",
        highlight: "unforgettable moments",
        description: "Magical home wedding setups, floral arrangements, and thematic decor that leave your guests in awe.",
        primaryCta: { text: "Browse Decor", link: "/categories/home-setup-pandal-tent-dj" },
        secondaryCta: { text: "Get Inspired", link: "/categories" },
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

    // Autoplay logic
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
            className="relative w-full overflow-hidden bg-ink select-none min-h-[480px] sm:min-h-[540px] md:min-h-[600px] flex items-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slides container */}
            <div
                className="flex w-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {slidesData.map((slide) => (
                    <div key={slide.id} className="min-w-full relative flex items-center py-20 sm:py-24 md:py-28 px-4 sm:px-6 lg:px-12">
                        {/* Background image */}
                        <div className="absolute inset-0 z-0">
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
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-transparent z-10" />

                        {/* Content */}
                        <div className="relative z-20 max-w-7xl mx-auto w-full">
                            <div className="max-w-2xl text-white space-y-4 sm:space-y-6">
                                <span className="inline-block text-gold text-xs sm:text-sm font-semibold tracking-widest uppercase px-3.5 py-1 rounded-full bg-gold/15 border border-gold/30 backdrop-blur-sm">
                                    {slide.eyebrow}
                                </span>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                                    {slide.title} <span className="text-gold italic">{slide.highlight}</span>
                                </h1>
                                <p className="text-sm sm:text-base md:text-lg text-white/85 leading-relaxed font-sans max-w-xl">
                                    {slide.description}
                                </p>
                                {/* CTA Buttons */}
                                <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-4">
                                    <Link
                                        href={slide.primaryCta.link}
                                        className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-medium text-sm sm:text-base shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition-all duration-200 transform hover:-translate-y-0.5"
                                    >
                                        {slide.primaryCta.text}
                                    </Link>
                                    <Link
                                        href={slide.secondaryCta.link}
                                        className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-medium text-sm sm:text-base transition-all duration-200"
                                    >
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
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/35 backdrop-blur-md border border-white/25 text-white text-2xl items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={goToPrev}
                aria-label="Previous slide"
            >
                &#x2039;
            </button>
            <button
                type="button"
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/35 backdrop-blur-md border border-white/25 text-white text-2xl items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={goToNext}
                aria-label="Next slide"
            >
                &#x203A;
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {slidesData.map((_, idx) => (
                    <button
                        type="button"
                        key={idx}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? 'w-8 bg-gold' : 'w-2.5 bg-white/40 hover:bg-white/70'
                        }`}
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlideshow;