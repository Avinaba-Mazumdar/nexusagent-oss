import * as React from 'react';

export interface NexusLogoProps extends React.SVGProps<SVGSVGElement> {
    variant?: 'brand' | 'glyph';
    size?: number | string;
}

export function NexusLogo({ variant = 'brand', size, className = '', ...props }: NexusLogoProps) {
    if (variant === 'glyph') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} fill="none" className={className} {...props}>
                <g fill="currentColor">
                    <rect x="111.5" y="112.5" width="64" height="287" rx="32" />
                    <rect x="336.5" y="112.5" width="64" height="287" rx="32" />
                    <polygon points="127.5,176.5 175.5,150.9 384.5,335.5 336.5,361.1" />
                    <circle cx="256" cy="256" r="64" />
                </g>
                <circle cx="256" cy="256" r="35" className="fill-background" />
                <circle cx="256" cy="256" r="16" fill="currentColor" />
            </svg>
        );
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} fill="none" className={className} {...props}>
            <rect width="512" height="512" rx="116" fill="#004ea1" />
            <g fill="#ffffff">
                <rect x="111.5" y="112.5" width="64" height="287" rx="32" />
                <rect x="336.5" y="112.5" width="64" height="287" rx="32" />
                <polygon points="127.5,176.5 175.5,150.9 384.5,335.5 336.5,361.1" />
                <circle cx="256" cy="256" r="64" />
            </g>
            <circle cx="256" cy="256" r="35" fill="#004ea1" />
            <circle cx="256" cy="256" r="16" fill="#ffffff" />
        </svg>
    );
}
