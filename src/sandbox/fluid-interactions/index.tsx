import { motion } from "motion/react";
import { useRef } from "react";
import "./styles.css";

export default function FluidInteractions() {
    // We use a ref to create a bounding box that the draggable element cannot escape
    const constraintsRef = useRef<HTMLDivElement>(null);

    return (
        <div className="fluid-sandbox">
            <div className="fluid-sandbox__instructions">
                <p>Interact with the element below to test Framer Motion's spring physics and bounding constraints.</p>
            </div>

            {/* The Isolation Frame / Bounding Box */}
            <div className="fluid-sandbox__stage" ref={constraintsRef}>

                {/* The Interactive Element */}
                <motion.div
                    className="draggable-element"
                    drag
                    dragConstraints={constraintsRef}
                    dragElastic={0.2} // How much it stretches outside the bounds before snapping back
                    whileHover={{ scale: 1.05, cursor: "grab" }}
                    whileTap={{ scale: 0.95, cursor: "grabbing" }}
                    initial={{ y: -50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                    }}
                >
                    Drag Me
                </motion.div>

            </div>
        </div>
    );
}