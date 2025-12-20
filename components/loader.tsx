'use client';

import React from 'react';
import styled from 'styled-components';

interface LoaderProps {
text?: string;
size?: 'small' | 'medium' | 'large';
textColor?: string;
color?: string;
}

const Loader: React.FC<LoaderProps> = ({
text,
size = 'medium',
textColor,
color = '#1e293b',
}) => {
return (
<StyledWrapper $color={color} $textColor={textColor}>
    <div className={`spinner ${size}`}></div>
    {text && <p className="loader-text">{text}</p>}
</StyledWrapper>
);
};

const StyledWrapper = styled.div<{ $color: string; $textColor?: string }>`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
gap: 1rem;

.loader-text {
margin-top: 0.5rem;
color: ${(props) => props.$textColor || '#687280'};
font-size: 0.875rem;
text-align: center;
}

.spinner {
border: none;
border-top: 3px solid ${(props) => props.$color};
border-radius: 50%;
animation: spin 0.8s linear infinite;
}

.spinner.small {
width: 20px;
height: 20px;
border-top-width: 2px;
}

.spinner.medium {
width: 32px;
height: 32px;
border-top-width: 3px;
}

.spinner.large {
width: 60px;
height: 60px;
border-top-width: 4px;
}

@keyframes spin {
0% {
    transform: rotate(0deg);
}
100% {
    transform: rotate(360deg);
}
}
`;

export default Loader;
