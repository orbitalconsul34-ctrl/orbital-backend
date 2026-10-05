// Cobros con Culqi. Usa la llave SECRETA, así que solo vive en el backend.
// Requiere Node 18+ (fetch incluido).
const CULQI_API = 'https://api.culqi.com/v2';

// Crea un cargo con el token que generó el checkout (tarjeta o Yape).
// El monto sale de la base de datos, nunca del navegador.
const crearCargo = async ({ monto, email, tokenId, descripcion, metadata }) => {
    if (!process.env.CULQI_SECRET_KEY) throw new Error('Falta CULQI_SECRET_KEY en el .env');

    const respuesta = await fetch(`${CULQI_API}/charges`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CULQI_SECRET_KEY}`
        },
        body: JSON.stringify({
            amount: Math.round(Number(monto) * 100), // Culqi trabaja en céntimos: S/ 150 = 15000
            currency_code: 'PEN',
            email,
            source_id: tokenId,
            description: descripcion,
            metadata
        })
    });
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok || !String(data.id || '').startsWith('chr_')) {
        // user_message es el texto pensado para mostrarse al cliente (ej: "Tarjeta rechazada")
        const error = new Error(data.user_message || data.merchant_message || 'No se pudo procesar el pago. Intenta con otro medio.');
        error.culqi = data;
        throw error;
    }
    return data; // data.id = "chr_test_..." (guárdalo: sirve para reembolsos y soporte)
};

module.exports = { crearCargo };