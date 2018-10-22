class Sounds {
    constructor(el=document.body) {
        if (!((el instanceof HTMLElement) || (el instanceof HTMLDocument)))
            throw new TypeError("ParameterError: el must be a valid HTML element!")

        this.audioContext = new AudioContext();

        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);

        this.ready = false;

        const eventListenerFunction = () => {
            if (!this.ready) {
                audioCtx.resume().then(() => 
                    this.ready = true
                );
            } else {
                el.removeEventListener('click', eventListenerFunction);
            }
        };
        el.addEventListener('click', eventListenerFunction);
    }

    set volume(value) {
        if (value < 0) value = 0;
        this.gainNode.gain.value = value;
    }
    get volume() {
        return this.gainNode.gain.value;
    }

    load(url) {
        return fetch(url)
            .then(res => res.arrayBuffer())
            .then(res => this.audioContext.decodeAudioData(res))
            .then(res => new Sound(this.audioContext, res, this.gainNode));
    }
}

class Sound {
    constructor(audioContext, buffer, parentNode) {
        if (!(audioContext instanceof AudioContext))
            throw new TypeError("ParameterError: audioContext must be an AudioContext!")

        if (!(buffer instanceof AudioBuffer))
            throw new TypeError("ParameterError: buffer must be an AudioBuffer!")

        this.audioContext = audioContext;
        this.parentNode = parentNode

        this.buffer = buffer;
        this.detune = 0;
        this.loop = false;
        this.loopEnd = 0;
        this.loopStart = 0;
        this.playbackRate = 1;
    }

    play() {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.connect(this.parentNode);

        source.detune.value = this.detune;
        source.loop = this.loop;
        source.loopEnd = this.loopEnd;
        source.loopStart = this.loopStart;
        source.playbackRate.value = this.playbackRate;

        source.start(0);
        return source;
    }
}