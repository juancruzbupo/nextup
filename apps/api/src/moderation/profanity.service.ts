import { Injectable } from '@nestjs/common';

// Spanish profanity list + common evasions (l33t speak, spaces, etc.)
const BLOCKED_WORDS = [
  // Insultos directos
  'puto', 'puta', 'put0', 'put4', 'putos', 'putas',
  'mierda', 'mi3rda', 'mierd4',
  'pelotudo', 'pelotuda', 'pelotud0',
  'boludo', 'boluda', 'bolud0',
  'forro', 'forra', 'forr0',
  'conchudo', 'conchuda', 'concha',
  'carajo',
  'mogolico', 'mogólico', 'mogolica',
  'retrasado', 'retrasada',
  'idiota', 'idi0ta',
  'imbecil', 'imbécil',
  'estupido', 'estúpido', 'estupida', 'estúpida',
  'tarado', 'tarada',
  'hdp', 'hijo de puta', 'hija de puta',
  'la concha', 'ctm', 'cdtm',
  'sorete', 'sor3te',
  'verga', 'verg4',
  'poronga', 'p0ronga',
  'chupar', 'chupala', 'chupame', 'chupam3',
  'cogeme', 'cógeme', 'cojeme',
  'culiao', 'culiau', 'culiado',
  'trolo', 'trola',
  'negro de mierda', 'negra de mierda',
  // English basics
  'fuck', 'fck', 'shit', 'sh1t', 'bitch', 'b1tch',
  'asshole', 'ass hole', 'dick', 'd1ck',
  // Agresiones
  'te voy a matar', 'te mato',
  'muerte', 'morite', 'morí',
  'violarte', 'violar',
];

@Injectable()
export class ProfanityService {
  private patterns: RegExp[];

  constructor() {
    this.patterns = BLOCKED_WORDS.map((word) => {
      // For multi-word phrases, match as-is (case insensitive)
      if (word.includes(' ')) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escaped, 'i');
      }
      // For single words, allow optional separators between letters (p.u.t.o, p-u-t-o)
      const letters = word.replace(/[^a-záéíóúñü0-9]/gi, '').split('');
      const flexible = letters.join('[\\s._-]*');
      return new RegExp(flexible, 'i');
    });
  }

  /**
   * Check if text contains profanity.
   * Returns { clean: true } or { clean: false, reason: string }
   */
  check(text: string | undefined | null): { clean: boolean; reason?: string } {
    if (!text || text.trim().length === 0) return { clean: true };

    const normalized = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase();

    for (const pattern of this.patterns) {
      if (pattern.test(normalized)) {
        return { clean: false, reason: 'Contiene lenguaje no permitido' };
      }
    }

    return { clean: true };
  }
}
