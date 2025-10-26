"use client";
import React from 'react';
import PillNav from '@/components/PillNav';

const NavBar: React.FC = () => {
    const items = [
        { label: 'Home', href: '#hero' },
        { label: 'About', href: '#about' },
        { label: 'Solution', href: '#solution' },
        { label: 'Product', href: '#product' },
        { label: 'Team', href: '#team' },
        { label: 'Simulation', href: '/admin' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center">
            <PillNav
                items={items}
                className="custom-nav"
                ease="power2.easeOut"
                baseColor="#000000"
                pillColor="#ffffff"
                hoveredPillTextColor="#ffffff"
                pillTextColor="#000000"
            />
        </div>
    );
};

export default NavBar;
