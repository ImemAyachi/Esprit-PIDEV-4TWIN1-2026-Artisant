import React, { useEffect } from 'react';

const ScreenReaderFocus = () => {
    useEffect(() => {
        const handleFocus = (event) => {
            const target = event.target;
            if (!target) return;

            // List of elements we definitely want to skip if they're just containers
            const skipTags = ['DIV', 'SECTION', 'MAIN', 'NAV', 'HEADER', 'FOOTER'];
            if (skipTags.includes(target.tagName) && !target.getAttribute('aria-label') && !target.getAttribute('role') && target.tabIndex === -1) {
                return;
            }

            let textToSpeak = '';
            let role = target.getAttribute('role') || target.tagName.toLowerCase();

            // 1. Check for aria-label or aria-labelledby
            if (target.getAttribute('aria-label')) {
                textToSpeak = target.getAttribute('aria-label');
            } else if (target.getAttribute('aria-labelledby')) {
                const labelElement = document.getElementById(target.getAttribute('aria-labelledby'));
                if (labelElement) textToSpeak = labelElement.textContent;
            }

            // 2. Check for associated label (for inputs/selects)
            if (!textToSpeak && target.id) {
                const label = document.querySelector(`label[for="${target.id}"]`);
                if (label) textToSpeak = label.textContent;
            }

            // 3. Check for placeholder or title
            if (!textToSpeak) {
                textToSpeak = target.placeholder || target.title || '';
            }

            // 4. Check for nested important text (for buttons/links with icons)
            if (!textToSpeak && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
                // Get all text but ignore hidden elements
                textToSpeak = Array.from(target.childNodes)
                    .map(node => node.nodeType === 3 ? node.textContent : (node.innerText || ''))
                    .join(' ')
                    .trim();
            }

            // 5. Fallback to innerText
            if (!textToSpeak) {
                textToSpeak = target.innerText || target.textContent || '';
            }

            textToSpeak = textToSpeak.trim().replace(/\s+/g, ' ');

            if (textToSpeak) {
                let contextualRole = '';

                if (role === 'button' || target.tagName === 'BUTTON') contextualRole = 'button';
                else if (role === 'link' || target.tagName === 'A') contextualRole = 'link';
                else if (target.tagName === 'INPUT') contextualRole = `${target.type || 'text'} field`;
                else if (target.tagName === 'SELECT') contextualRole = 'menu';
                else if (target.tagName === 'TEXTAREA') contextualRole = 'text area';
                else if (target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3') contextualRole = 'heading';

                const fullMessage = contextualRole ? `${contextualRole}: ${textToSpeak}` : textToSpeak;

                // Stop any current speech
                window.speechSynthesis.cancel();

                // Speak the message
                const utterance = new SpeechSynthesisUtterance(fullMessage);
                utterance.rate = 1.1; // Slightly faster for responsiveness
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);

                console.log(`[ScreenReader] Speaking: ${fullMessage}`);
            }
        };

        document.addEventListener('focusin', handleFocus);
        return () => document.removeEventListener('focusin', handleFocus);
    }, []);

    return null;
};

export default ScreenReaderFocus;
