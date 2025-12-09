export class MatrixText {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        this.originalText = this.element.innerText;
        this.chars = options.chars || "01";
        this.period = options.period || 300; // Interval between frames
        this.duration = options.duration || 3000; // Duration of the scramble effect per letter needed? 
        // Actually, the original React code had:
        // initialDelay = 200
        // letterAnimationDuration = 500
        // letterInterval = 100 (stagger between letters starting)

        this.letterAnimationDuration = options.letterAnimationDuration || 500;
        this.letterInterval = options.letterInterval || 100;
        this.initialDelay = options.initialDelay || 200;

        this.letters = this.originalText.split('').map(char => ({
            char,
            isSpace: char === ' ',
            isMatrix: false,
            currentDisplay: char
        }));

        this.isAnimating = false;

        // Prepare the DOM
        this.initDOM();

        // Start animation
        setTimeout(() => this.start(), this.initialDelay);
    }

    initDOM() {
        this.element.innerHTML = '';
        this.element.style.display = 'flex';
        this.element.style.flexWrap = 'wrap';
        // this.element.style.justifyContent = 'center'; // Original had this, but for a name in a bento grid, standard flow might be better? Original prompt: "MatrixText" component
        // The original component had 'items-center justify-center'. The user's H1 is left aligned in a bento cell (Cell 1).
        // Let's keep flex but maybe not force center if it breaks layout. 
        // Actually, H1 in the bento cell seems standard block.
        // Let's use inline-block spans.

        this.letterElements = this.letters.map((letter, index) => {
            const span = document.createElement('span');
            if (letter.isSpace) {
                span.innerHTML = '&nbsp;';
            } else {
                span.innerText = letter.char;
            }
            span.style.display = 'inline-block';
            span.style.width = '1ch';
            span.style.textAlign = 'center';
            span.style.transition = 'color 0.1s ease, text-shadow 0.1s ease';

            this.element.appendChild(span);
            return span;
        });
    }

    getRandomChar() {
        return Math.random() > 0.5 ? "1" : "0";
    }

    animateLetter(index) {
        if (index >= this.letters.length) return;

        const letterState = this.letters[index];
        if (letterState.isSpace) return;

        const span = this.letterElements[index];
        const originalChar = letterState.char;

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
            if (currentIndex >= this.letters.length) {
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
