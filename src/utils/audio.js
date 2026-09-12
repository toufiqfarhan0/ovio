/**
 * Helper to encode AudioBuffer to a standard 16-bit PCM WAV Blob (16kHz mono)
 * perfectly formatted for the AssemblyAI Dictation API.
 */
export function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // RIFF identifier
  writeString(view, 0, 'RIFF')
  // file length
  view.setUint32(4, 36 + samples.length * 2, true)
  // RIFF type
  writeString(view, 8, 'WAVE')
  // format chunk identifier
  writeString(view, 12, 'fmt ')
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (1 = PCM)
  view.setUint16(20, 1, true)
  // channel count (1 = mono)
  view.setUint16(22, 1, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true)
  // block align (channels * bytes per sample)
  view.setUint16(32, 2, true)
  // bits per sample
  view.setUint16(34, 16, true)
  // data chunk identifier
  writeString(view, 36, 'data')
  // data chunk length
  view.setUint32(40, samples.length * 2, true)

  // Write the PCM samples
  floatTo16BitPCM(view, 44, samples)

  return new Blob([view], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

/**
 * Creates a synthetic demo WAV utterance with gentle tone variations
 * to test the AssemblyAI pipeline even when mic is disabled.
 */
export function createDemoSpeechWav(sampleRate = 16000, duration = 3.5) {
  const totalSamples = Math.floor(sampleRate * duration)
  const samples = new Float32Array(totalSamples)
  
  // Synthesize a speech-like formant acoustic wave
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate
    // Formant simulation: fundamental frequency ~140Hz with harmonics
    const f0 = 140 + Math.sin(2 * Math.PI * 1.5 * t) * 15
    const v1 = Math.sin(2 * Math.PI * f0 * t) * 0.4
    const v2 = Math.sin(2 * Math.PI * f0 * 2.1 * t) * 0.25
    const v3 = Math.sin(2 * Math.PI * f0 * 3.4 * t) * 0.15
    // Envelope to sound like human syllables
    const envelope = Math.sin(Math.PI * (i / totalSamples)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3.5 * t))
    samples[i] = (v1 + v2 + v3) * envelope * 0.7
  }

  return encodeWAV(samples, sampleRate)
}
