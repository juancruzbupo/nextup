import { ProfanityService } from './profanity.service';

describe('ProfanityService', () => {
  let service: ProfanityService;

  beforeEach(() => {
    service = new ProfanityService();
  });

  it('should pass clean text', () => {
    expect(service.check('Para mi novia')).toEqual({ clean: true });
    expect(service.check('Mesa de los primos')).toEqual({ clean: true });
    expect(service.check('Feliz cumpleaños Sofi!')).toEqual({ clean: true });
  });

  it('should pass empty/null text', () => {
    expect(service.check('')).toEqual({ clean: true });
    expect(service.check(null)).toEqual({ clean: true });
    expect(service.check(undefined)).toEqual({ clean: true });
  });

  it('should catch direct profanity', () => {
    expect(service.check('sos un pelotudo').clean).toBe(false);
    expect(service.check('andate a la mierda').clean).toBe(false);
    expect(service.check('hijo de puta').clean).toBe(false);
  });

  it('should catch profanity with different casing', () => {
    expect(service.check('PELOTUDO').clean).toBe(false);
    expect(service.check('Mierda').clean).toBe(false);
  });

  it('should catch leet speak evasions', () => {
    expect(service.check('put0').clean).toBe(false);
    expect(service.check('mi3rda').clean).toBe(false);
  });

  it('should catch spaced evasions', () => {
    expect(service.check('p.u.t.o').clean).toBe(false);
    expect(service.check('p-e-l-o-t-u-d-o').clean).toBe(false);
  });

  it('should catch accented variants', () => {
    expect(service.check('mogólico').clean).toBe(false);
    expect(service.check('estúpido').clean).toBe(false);
  });

  it('should return reason on failure', () => {
    const result = service.check('sos un forro');
    expect(result.clean).toBe(false);
    expect(result.reason).toBe('Contiene lenguaje no permitido');
  });
});
