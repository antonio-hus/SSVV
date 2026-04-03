import React from "react";
import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';

/**
 * Configures the Inter font and exposes it as a CSS variable.
 *
 * @returns The configured font object with CSS variable support.
 * @throws {Error} If font loading fails.
 */
const inter = Inter({subsets: ['latin'], variable: '--font-sans'});

/**
 * Defines global metadata for the application.
 * @returns Static metadata used for SEO and document head.
 * @throws {Error} If metadata configuration is invalid.
 */
export const metadata: Metadata = {
    title: 'GymTracker Pro',
    description: 'Gym management and workout tracking platform',
};

/**
 * Provides the root HTML structure and global styles for the application.
 *
 * @param children - React nodes rendered within the layout.
 * @returns The root layout wrapping all pages.
 * @throws {Error} If layout rendering fails.
 */
export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en" className={inter.variable}>
            <body>{children}</body>
        </html>
    );
}