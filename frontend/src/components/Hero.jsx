'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/compat/Link';
import Image from '@/compat/Image';

const slidesData = [
    {
        id: 1,
        title: "Find your perfect",
        highlight: "wedding venue",
        description: "Explore hand-picked venues that match your style, budget, and guest count. From heritage palaces to modern banquet halls.",
        primaryCta: { text: "Explore Venues", link: "/categories/venues" },
        secondaryCta: { text: "View Packages", link: "/packages" },
        image: "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        eyebrow: "Weddings, made effortless"
    },
    {
        id: 2,
        title: "Expert planners,",
        highlight: "seamless execution",
        description: "Award-winning wedding planners & designers who bring your vision to life. End-to-end coordination, decor, and more.",
        primaryCta: { text: "Find a Planner", link: "/categories/planning-decor" },
        secondaryCta: { text: "See Success Stories", link: "/stories" },
        image: "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        eyebrow: "Plan with perfection"
    },
    {
        id: 3,
        title: "Stunning decor,",
        highlight: "unforgettable moments",
        description: "Magical home wedding setups, floral arrangements, and thematic decor that leave your guests in awe.",
        primaryCta: { text: "Browse Decor", link: "/categories/planning-decor" },
        secondaryCta: { text: "Get Inspired", link: "/gallery" },
        image: "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        eyebrow: "Decor that dazzles"
    }
];

const HeroSlideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoplayRef = useRef(null);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const totalSlides = slidesData.length;

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    // Autoplay logic
    useEffect(() => {
        if (isAutoPlaying) {
            autoplayRef.current = setInterval(goToNext, 6000);
        } else if (autoplayRef.current) {
            clearInterval(autoplayRef.current);
        }

        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [isAutoPlaying, goToNext]);

    const pauseAutoplay = () => setIsAutoPlaying(false);
    const resumeAutoplay = () => setIsAutoPlaying(true);

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
                pauseAutoplay();
            } else if (e.key === 'ArrowRight') {
                goToNext();
                pauseAutoplay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <section
            className="hero-slideshow"
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
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
                        <div
                            className="slide-bg"
                        ><Image
                                src={slide.image}
                                alt={slide.eyebrow}
                                fill
                                sizes="100vw"
                                style={{ objectFit: 'cover' }}
                                quality={85}
                            /></div>
                        <div className="slide-overlay" />

                        {/* Content container */}
                        <div className="container slide-content">
                            <div className="slide-text">
                                <span className="eyebrow">{slide.eyebrow}</span>
                                <h1>
                                    {slide.title} <span>{slide.highlight}</span>
                                </h1>
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

            {/* Dots indicator */}
            <div className="slider-dots">
                {slidesData.map((_, idx) => (
                    <button
                        key={idx}
                        className={`dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => { goToSlide(idx); pauseAutoplay(); }}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlideshow;