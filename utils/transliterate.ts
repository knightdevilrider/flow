export function transliterateToDevanagari(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Explicit mappings for titles
  result = result.replace(/\bDr\.\s/g, 'डॉ. ');
  result = result.replace(/\bDr\b/g, 'डॉ.');
  result = result.replace(/\bDoctor\b/g, 'डॉक्टर');
  result = result.replace(/\bDR\.\s/g, 'डॉ. ');
  result = result.replace(/\bDR\b/g, 'डॉ.');

  // Basic phonetic mapping for demo purposes.
  // Note: Full transliteration is complex without an API. This provides a rudimentary approximation.
  
  const map: Record<string, string> = {
    // Vowels and their matras
    'aa': 'ा', 'ee': 'ी', 'oo': 'ू',
    
    // Consonants
    'kh': 'ख', 'gh': 'घ', 'chh': 'छ', 'ch': 'च', 'jh': 'झ',
    'th': 'थ', 'dh': 'ध', 'ph': 'फ', 'bh': 'भ', 'sh': 'श',
    'k': 'क', 'g': 'ग', 'j': 'ज', 't': 'त', 'd': 'द',
    'n': 'न', 'p': 'प', 'b': 'ब', 'm': 'म', 'y': 'य',
    'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व', 's': 'स', 'h': 'ह',
    'c': 'क', 'x': 'क्स', 'z': 'ज़', 'q': 'क़', 'f': 'फ़',
    
    // Dependent vowels (simple substitution approximation)
    'a': 'ा', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो'
  };

  // Replace multi-character sequences first
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  
  // We only transliterate English words (A-Z)
  return result.split(' ').map(word => {
    // If it's already Devanagari (like our explicit replacements), return it
    if (/[ऀ-ॿ]/.test(word)) return word;
    
    let t = word.toLowerCase();
    let transliterated = '';
    
    for (let i = 0; i < t.length; ) {
      let matched = false;
      for (const key of keys) {
        if (t.substring(i, i + key.length) === key) {
          transliterated += map[key];
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        transliterated += t[i];
        i++;
      }
    }

    // Cleanup a few common artifacts of this naive approach
    transliterated = transliterated
                   .replace(/^ा/, 'अ')
                   .replace(/^ि/, 'इ')
                   .replace(/^ी/, 'ई')
                   .replace(/^ु/, 'उ')
                   .replace(/^ू/, 'ऊ')
                   .replace(/^े/, 'ए')
                   .replace(/^ो/, 'ओ');
                   
    return transliterated;
  }).join(' ');
}
