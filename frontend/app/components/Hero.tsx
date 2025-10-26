"use client";
import React from 'react'
import RotatingText from '@/components/RotatingText'
import { motion } from 'framer-motion'

const Hero = () => {
    return (
        <div id="hero" className="flex flex-col items-center justify-center text-center mt-[-50rem] px-4 text-xl">
            <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="text-4xl sm:text-5xl font-extrabold text-red-600">911 Operator</span>
                <RotatingText
                    texts={["Helper", "Assistant", "Emergency"]}
                    mainClassName="px-2 sm:px-2 md:px-3 bg-white text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg text-4xl sm:text-5xl font-extrabold"
                    staggerFrom={"last"}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2000}
                    auto={true}
                    loop={true}
                />
            </motion.div>
            
            <motion.p 
                className="text-center text-xl md:text-2xl text-black dark:text-gray-300 max-w-2xl mx-auto mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                Assist 911 operators in making faster, more informed decisions with AI-powered location detection and response recommendations
            </motion.p>
            
            <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <a href="/admin" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-center">
                    Try the Demo
                </a>
                <a className="px-6 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200" href="https://github.com/Ben2104/Marina-Hacks2">
                    View on GitHub
                </a>
            </motion.div>
        </div>
    )
}

export default Hero