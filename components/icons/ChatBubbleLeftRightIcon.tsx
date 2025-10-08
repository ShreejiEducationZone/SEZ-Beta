import React from 'react';

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.534a1.125 1.125 0 0 1-1.097-.987l-.21-1.263a1.125 1.125 0 0 0-1.097-.987H8.25c-.552 0-1-.448-1-1v-1.5c0-.552.448-1 1-1H9.75c.552 0 1-.448 1-1V8.25c0-.552-.448-1-1-1H3.25a1.125 1.125 0 0 0-1.097.987l-.21 1.263a1.125 1.125 0 0 1-1.097.987l-3.722-.534A2.122 2.122 0 0 1 .525 6.443c.884-.284 1.5-1.128 1.5-2.097V3.513c0-1.136.847-2.1 1.98-2.193l3.722-.534a1.125 1.125 0 0 1 1.097.987l.21 1.263a1.125 1.125 0 0 0 1.097.987h3.75c.552 0 1 .448 1 1v1.5c0 .552-.448 1-1 1H12.25c-.552 0-1 .448-1 1v2.25c0 .552.448 1 1 1h.75a1.125 1.125 0 0 1 1.097.987l.21 1.263a1.125 1.125 0 0 0 1.097.987l3.722.534c1.133.09 1.98.943 1.98 2.083Z" />
    </svg>
);

export default ChatBubbleLeftRightIcon;