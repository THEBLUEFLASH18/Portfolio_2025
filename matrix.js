export class MatrixText {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        // Use innerHTML to capture <br> tags, then parse
        this.originalHTML = this.element.innerHTML;

        this.chars = options.chars || "01";
        this.period = options.period || 300;
        this.duration = options.duration || 3000;

        this.letterAnimationDuration = options.letterAnimationDuration || 500;
        this.letterInterval = options.letterInterval || 100;
        this.initialDelay = options.initialDelay || 200;

        // Parse HTML into a structure that preserves formatting (br)
        this.parsedContent = this.parseContent(this.originalHTML);

        this.isAnimating = false;

        // Prepare the DOM
        this.initDOM();

        // Start animation
        setTimeout(() => this.start(), this.initialDelay);
    }

    parseContent(html) {
        // Simple parser: split by <br> and reconstruct with markers
        // We want a flat array of "items" where an item is either a character to animate
        // or a special "break" marker.

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const items = [];

        // Iterate over child nodes to handle text and BRs
        Array.from(tempDiv.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                text.split('').forEach(char => {
                    items.push({
                        type: 'char',
                        char: char,
                        isSpace: char === ' ',
                        isMatrix: false
                    });
                });
            } else if (node.nodeName === 'BR') {
                items.push({ type: 'break' });
            }
        });

        return items;
    }

    initDOM() {
        this.element.innerHTML = '';
        // Remove flex to allow standard flow with breaks, or handle breaks manually in flex
        // The user wants "Marcos" above "Galdamez" on mobile.
        // Standard inline-block with <br> works better than flex for this.
        this.element.style.display = 'block';
        // using css for text align

        this.letterElements = [];
        this.animateableItems = []; // Keep track of only the chars for animation index

        this.parsedContent.forEach((item, index) => {
            if (item.type === 'break') {
                this.element.appendChild(document.createElement('br'));
            } else {
                const span = document.createElement('span');
                if (item.isSpace) {
                    span.innerHTML = '&nbsp;';
                } else {
                    span.innerText = item.char;
                }
                span.style.display = 'inline-block';
                span.style.width = '1ch';
                span.style.textAlign = 'center';
                span.style.transition = 'color 0.1s ease, text-shadow 0.1s ease';

                this.element.appendChild(span);
                this.letterElements.push(span); // Store reference
                this.animateableItems.push(item); // Store data
            }
        });
    }

    getRandomChar() {
        return Math.random() > 0.5 ? "1" : "0";
    }

    animateLetter(index) {
        if (index >= this.letterElements.length) return;

        const item = this.animateableItems[index];
        if (item.isSpace) return;

        const span = this.letterElements[index];
        const originalChar = item.char;

        // Start Matrix State
        const startTime = Date.now();

        const updateFrame = () => {
            const now = Date.now();
            const elapsed = now - startTime;

            if (elapsed < this.letterAnimationDuration) {
                // In matrix mode
                span.innerText = this.getRandomChar();
                span.style.color = "#00ff00";
                span.style.textShadow = "0 2px 4px rgba(0, 255, 0, 0.5)";
                requestAnimationFrame(updateFrame);
            } else {
                // End matrix mode
                span.innerText = originalChar;
                span.style.color = ""; // Revert to inherited or original
                span.style.textShadow = "";
            }
        };

        requestAnimationFrame(updateFrame);
    }

    start() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        let currentIndex = 0;

        const nextLetter = () => {
            if (currentIndex >= this.letterElements.length) {
                this.isAnimating = false;
                return;
            }

            this.animateLetter(currentIndex);
            currentIndex++;
            setTimeout(nextLetter, this.letterInterval);
        };

        nextLetter();
    }
}
