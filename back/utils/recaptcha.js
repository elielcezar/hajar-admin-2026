import { AppError } from './errors.js';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SCORE_THRESHOLD = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifica o token reCAPTCHA v3 com a API do Google.
 * Retorna { success, score, action } se válido.
 * Lança erro se a verificação falhar.
 * Se RECAPTCHA_SECRET_KEY não estiver configurada, pula a verificação (dev mode).
 */
export async function verifyRecaptcha(token) {
    if (!RECAPTCHA_SECRET_KEY) {
        console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY não configurada — verificação ignorada');
        return { success: true, score: 1.0, action: 'bypass', skipped: true };
    }

    if (!token) {
        throw new RecaptchaError('Token reCAPTCHA não fornecido');
    }

    const params = new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
    });

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
        console.warn('[reCAPTCHA] Verificação falhou:', data['error-codes']);
        throw new RecaptchaError('Falha na verificação reCAPTCHA');
    }

    if (data.score < RECAPTCHA_SCORE_THRESHOLD) {
        console.warn(`[reCAPTCHA] Score baixo: ${data.score} (mínimo: ${RECAPTCHA_SCORE_THRESHOLD})`);
        throw new RecaptchaError('Atividade suspeita detectada. Tente novamente.');
    }

    console.log(`[reCAPTCHA] Verificado — score: ${data.score}, action: ${data.action}`);
    return { success: true, score: data.score, action: data.action };
}

export class RecaptchaError extends AppError {
    constructor(message) {
        super(message, 403);
    }
}
