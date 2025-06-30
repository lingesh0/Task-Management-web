import React, { useState, useEffect } from 'react';
import '../css/AIFeatureSlider.css';

const AIFeatureSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            icon: "🧠",
            title: "Smart Task Creation",
            description: "Just type naturally, and let our AI convert your words into a task instantly.",
            example: '"Remind me to submit the report tomorrow at 10 AM" ➜ Auto-filled task with time, priority, and tags.',
            color: "#7c3aed"
        },
        {
            id: 2,
            icon: "🔁",
            title: "AI-Powered Reminders",
            description: "Never miss a deadline again. Get smart email or in-app reminders powered by intelligent scheduling logic.",
            color: "#8b5cf6"
        },
        {
            id: 3,
            icon: "🎯",
            title: "Priority Prediction",
            description: "Our AI helps categorize and prioritize tasks for you — High, Medium, or Low — based on content and context.",
            color: "#06b6d4"
        },
        {
            id: 4,
            icon: "🏷️",
            title: "Auto Tag Suggestions",
            description: "Typing a task? Our model suggests relevant tags like #Work, #Urgent, or #Personal to organize effortlessly.",
            color: "#10b981"
        },
        {
            id: 5,
            icon: "📅",
            title: "Natural Language Scheduling",
            description: "Say goodbye to complex forms — just describe your task in plain English and let AI handle the rest.",
            color: "#f59e0b"
        },
        {
            id: 6,
            icon: "🧑‍💼",
            title: "AI That Understands You",
            description: "The more you use it, the smarter it gets. Our AI learns from your patterns to assist better each day.",
            color: "#ef4444"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000); // Change slide every 4 seconds

        return () => clearInterval(interval);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const goToNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const goToPrevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div className="ai-feature-slider">
            <div className="slider-container">
                <div 
                    className="slider-track"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div key={slide.id} className="slide">
                            <div 
                                className="slide-content"
                                style={{ '--slide-color': slide.color }}
                            >
                                <div className="slide-icon">{slide.icon}</div>
                                <h3 className="slide-title">{slide.title}</h3>
                                <p className="slide-description">{slide.description}</p>
                                {slide.example && (
                                    <div className="slide-example">
                                        <p>{slide.example}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button className="slider-nav prev" onClick={goToPrevSlide}>
                    <span>‹</span>
                </button>
                <button className="slider-nav next" onClick={goToNextSlide}>
                    <span>›</span>
                </button>

                {/* Dots Indicator */}
                <div className="slider-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIFeatureSlider; 