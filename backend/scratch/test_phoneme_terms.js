const { TECH_TERMS_TRANSLITERATION, TECH_TERMS_WHITELIST } = require('../services/techTerms');
console.log('Transliteration terms count:', Object.keys(TECH_TERMS_TRANSLITERATION).length);
console.log('Whitelist terms count:', TECH_TERMS_WHITELIST.size);
console.log('ai ->', TECH_TERMS_TRANSLITERATION['ai']);
console.log('sdlc ->', TECH_TERMS_TRANSLITERATION['sdlc']);
console.log('ai-driven sdlc ->', TECH_TERMS_TRANSLITERATION['ai-driven sdlc']);
console.log('deepseek r1 ->', TECH_TERMS_TRANSLITERATION['deepseek r1']);
console.log('claude 3.5 sonnet ->', TECH_TERMS_TRANSLITERATION['claude 3.5 sonnet']);
