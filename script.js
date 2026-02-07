document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('vocabulary-grid');

    // Sort logic implementation helper
    // currently just rendering in order of array

    let animationDelay = 0;

    vocabularyData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 50}ms`;

        // Add content
        card.innerHTML = `
            ${item.category ? `<span class="category-label">${item.category}</span>` : ''}
            <div class="hanzi">${item.hanzi}</div>
            <div class="pinyin">${item.pinyin}</div>
        `;

        // Add click event for speech
        card.addEventListener('click', (e) => {
            speak(item.hanzi);
            createRipple(e, card);
        });

        grid.appendChild(card);
    });
});

function speak(text) {
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // Mandarin Chinese
    utterance.rate = 0.8; // Slightly slower for learning

    // Try to find a Mandarin voice
    const voices = window.speechSynthesis.getVoices();

    // Priority order for Mandarin voices
    let chineseVoice = voices.find(voice => voice.lang === 'zh-CN'); // Exact match Mainland
    if (!chineseVoice) chineseVoice = voices.find(voice => voice.lang === 'zh-TW'); // Exact match Taiwan
    if (!chineseVoice) chineseVoice = voices.find(voice => voice.lang.includes('zh-CN')); // Includes match
    if (!chineseVoice) chineseVoice = voices.find(voice => voice.lang.includes('zh-TW')); // Includes match

    // If still no voice, try to find any Chinese voice that is NOT Hong Kong (Cantonese)
    if (!chineseVoice) {
        chineseVoice = voices.find(voice =>
            voice.lang.includes('zh') &&
            !voice.lang.includes('HK') &&
            !voice.lang.includes('yue') // 'yue' is the code for Cantonese
        );
    }

    if (chineseVoice) {
        utterance.voice = chineseVoice;
    }

    // Explicitly set the lang again just in case
    utterance.lang = 'zh-CN';

    window.speechSynthesis.speak(utterance);
}

// Simple ripple effect visual feedback
function createRipple(event, container) {
    const circle = document.createElement('span');
    const diameter = Math.max(container.clientWidth, container.clientHeight);
    const radius = diameter / 2;

    const rect = container.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripple = container.getElementsByClassName('ripple')[0];

    if (ripple) {
        ripple.remove();
    }

    container.appendChild(circle);
}

// Pre-load voices to ensure they are available when requested
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};
