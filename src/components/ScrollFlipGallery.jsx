import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'

// Gallery Data Array - add a 7th event here without touching animation code
const events = [
  {
    image: "/images/hack4sdg.png",
    title: "Ideathon Hack4SDG",
    category: "Hackathon",
    description: "Hackathon event focused on sustainable development solutions."
  },
  {
    image: "/images/bplan.png",
    title: "B-Plan Pitch: Demo Day",
    category: "Pitch Event",
    description: "Demo day event for pitching business plans and showcasing innovations."
  },
  {
    image: "/images/panel.png",
    title: "Panel Discussion",
    category: "Discussion",
    description: "Interactive panel with innovation and startup ecosystem enablers."
  },
  {
    image: "/images/innovation.png",
    title: "Innovation Workshop",
    category: "Workshop",
    description: "Hands-on workshop focusing on creative thinking and problem-solving techniques."
  },
  {
    image: "/images/mentorship.png",
    title: "Startup Mentorship",
    category: "Mentorship",
    description: "One-on-one mentorship sessions with successful entrepreneurs and industry experts."
  },
  {
    image: "/images/achievement.png",
    title: "Achievement Awards",
    category: "Awards",
    description: "Annual ceremony recognizing outstanding innovations and entrepreneurial achievements."
  }
]

const TOTAL_TRANSITIONS = events.length - 1

// Exact flip transition — this is the ONLY transition controlling rotateY
const flipTransition = {
  duration: 1.3,
  ease: [0.45, 0, 0.2, 1],
}

function ScrollFlipGallery() {
  const sectionRef = useRef(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll tracking for the pinned section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  })

  // CONTINUOUS DIAGONAL DRIFT — scroll-linked, no spring, no per-flip animation.
  // These drive a SEPARATE outer wrapper from the flipping card.
  const driftX = useTransform(scrollYProgress, [0, 1], [0, 90])
  const driftY = useTransform(scrollYProgress, [0, 1], [0, 140])

  // Determine which step we're on based on scroll position.
  // Math.round gives equal dwell before/after each transition boundary.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (isMobile) return
    const step = Math.min(Math.round(p * TOTAL_TRANSITIONS), events.length - 1)
    setCurrentStep(step)
    setScrollHintVisible(p < 0.02)
  })

  // Mobile handlers
  const handleNext = () => setCurrentStep((prev) => (prev + 1) % events.length)
  const handlePrev = () => setCurrentStep((prev) => (prev - 1 + events.length) % events.length)

  return (
    <div
      ref={sectionRef}
      className="flip-gallery-outer"
      style={{ height: isMobile ? 'auto' : `${(TOTAL_TRANSITIONS + 1) * 200}vh` }}
    >
      <div className="flip-gallery-sticky">
        <div className="flip-gallery-content">

          {/* COLUMN 1: Photo Card */}
          <div className="flip-stack-wrapper">
            {isMobile ? (
              <div className="flip-frame" onClick={handleNext}>
                <div className="flip-card-single">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentStep}
                      src={events[currentStep].image}
                      alt={events[currentStep].title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    />
                  </AnimatePresence>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: '#888' }}>
                  Tap photo to flip next
                </div>
              </div>
            ) : (
              /* Desktop: DRIFT wrapper (scroll-linked x/y) is SEPARATE from the flip card */
              <motion.div className="flip-frame" style={{ x: driftX, y: driftY }}>
                <DesktopFlipCard
                  currentStep={currentStep}
                  events={events}
                />
              </motion.div>
            )}
          </div>

          {/* COLUMN 2: Text Panel */}
          <div className="info-panel">
            <div className="info-panel-inner">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="info-slide"
                >
                  <span className="info-category">{events[currentStep].category}</span>
                  <h2 className="info-title">{events[currentStep].title}</h2>
                  <p className="info-description">{events[currentStep].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="progress-indicator">
              {isMobile && (
                <button onClick={handlePrev} className="nav-arrow-btn" aria-label="Previous">
                  ◀
                </button>
              )}

              <div className="progress-dots">
                {events.map((_, idx) => (
                  <div
                    key={idx}
                    className={`progress-dot ${idx === currentStep ? 'active' : ''}`}
                    onClick={isMobile ? () => setCurrentStep(idx) : undefined}
                    style={{ cursor: isMobile ? 'pointer' : 'default' }}
                  />
                ))}
              </div>

              <span className="progress-count">
                {currentStep + 1} / {events.length}
              </span>

              {isMobile && (
                <button onClick={handleNext} className="nav-arrow-btn" aria-label="Next">
                  ▶
                </button>
              )}
            </div>
          </div>

        </div>

        {!isMobile && (
          <div className={`scroll-hint ${!scrollHintVisible ? 'hidden' : ''}`}>
            <span>Scroll to Flip Gallery</span>
            <div className="scroll-arrow"></div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * DesktopFlipCard — discrete, time-based 3D flip.
 *
 * Architecture:
 *  - Target rotateY = currentStep * 180 (each step adds one half-turn)
 *  - Framer Motion's `animate` + `flipTransition` handles the actual rotation
 *    over 1.3 seconds — NOT scroll-linked, NOT a spring.
 *  - The constant `rotate: -8` (Z-axis tilt) is applied via `style` so the
 *    card always looks like a tilted photograph.
 *  - Face images are swapped only on the HIDDEN face so the currently-visible
 *    face never jumps mid-flip.
 */
function DesktopFlipCard({ currentStep, events }) {
  const [faces, setFaces] = useState({ front: 0, back: 1 })
  const prevStepRef = useRef(0)

  useEffect(() => {
    const prevStep = prevStepRef.current
    prevStepRef.current = currentStep

    if (currentStep === prevStep) return

    // Only update the HIDDEN face — the one about to be revealed by the flip.
    // The currently-visible face stays unchanged to prevent visual jumps.
    if (prevStep % 2 === 0) {
      // Front was visible (even step) → back is about to be revealed
      setFaces((prev) => ({ ...prev, back: currentStep }))
    } else {
      // Back was visible (odd step) → front is about to be revealed
      setFaces((prev) => ({ ...prev, front: currentStep }))
    }
  }, [currentStep])

  // Target rotation: each step adds 180 degrees of continuous rotation
  const targetRotateY = currentStep * 180

  return (
    <div className="flip-card-perspective">
      <motion.div
        className="flip-card-inner"
        style={{ rotate: -8 }}
        animate={{ rotateY: targetRotateY }}
        transition={flipTransition}
      >
        {/* Front Face */}
        <div className="flip-face flip-face-front">
          <img
            src={events[faces.front].image}
            alt={events[faces.front].title}
          />
        </div>

        {/* Back Face */}
        <div className="flip-face flip-face-back">
          <img
            src={events[faces.back].image}
            alt={events[faces.back].title}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default ScrollFlipGallery
