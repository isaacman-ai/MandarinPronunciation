document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('vocabulary-grid');
    const voiceSelect = document.getElementById('voice-select');
    const debugEl = document.getElementById('debug-info');

    // Initial debug message to confirm script version
    if (debugEl) debugEl.textContent = 'v2.1 Ready. Waiting for interaction...';

    let voices = [];

    // Populate voice list
    function populateVoiceList() {
        if (typeof speechSynthesis === 'undefined') {
            return;
        }

        voices = window.speechSynthesis.getVoices();

        // Filter for Chinese voices only to keep the list clean
        // Include zh-CN, zh-TW, zh-HK (so users can see if their device defaults to it)
        const chineseVoices = voices.filter(voice =>
            voice.lang.includes('zh') ||
            voice.lang.includes('cmn') ||
            voice.lang.includes('yue')
        );

        voiceSelect.innerHTML = '';

        if (chineseVoices.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No Chinese voices found';
            option.disabled = true;
            voiceSelect.appendChild(option);
            return;
        }

        let defaultFound = false;

        chineseVoices.forEach(voice => {
            const option = document.createElement('option');
            // Display name format: "Name (Lang)" e.g. "Ting-Ting (zh-CN)"
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);

            // Auto-select logic: Prioritize Mandarin (CN > TW)
            if (!defaultFound) {
                if (voice.lang === 'zh-CN' || voice.lang === 'zh-TW') {
                    option.selected = true;
                    defaultFound = true;
                }
            }
        });

        // If no strict Mandarin found, try loose match but avoid HK/Cantonese if possible
        if (!defaultFound) {
            const looseMandarin = chineseVoices.find(v => !v.lang.includes('HK') && !v.lang.includes('yue'));
            if (looseMandarin) {
                Array.from(voiceSelect.options).forEach(opt => {
                    if (opt.getAttribute('data-name') === looseMandarin.name) {
                        opt.selected = true;
                    }
                });
            }
        }
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // Rendering Grid
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

    function speak(text) {
        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;

        // Refresh voices list to ensure we have valid objects (fix for iOS)
        const currentVoices = window.speechSynthesis.getVoices();
        const selectedOption = voiceSelect.selectedOptions[0];

        if (selectedOption) {
            const selectedName = selectedOption.getAttribute('data-name');
            const selectedLang = selectedOption.getAttribute('data-lang');

            // Try to match by name from the FRESH list
            const voiceListToUse = currentVoices.length > 0 ? currentVoices : voices;
            const selectedVoice = voiceListToUse.find(voice => voice.name === selectedName);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                if (debugEl) debugEl.textContent = `Playing: ${selectedVoice.name} | Lang: ${selectedVoice.lang}`;
            } else {
                // Fallback: if voice object is missing, at least set the lang
                // This might force iOS to pick a different voice with the same lang
                if (selectedLang) {
                    utterance.lang = selectedLang;
                    if (debugEl) debugEl.textContent = `Fallback: Force Lang ${selectedLang} (Object lost)`;
                }
            }
        }

        window.speechSynthesis.speak(utterance);
    }
});


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
