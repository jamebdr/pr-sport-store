// SIMPLIFIED send-order.js - Basic working version
exports.handler = async function(event, context) {
    console.log('Function started');
    
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        console.log('Processing order...');
        
        // Parse the request body
        let data;
        try {
            data = JSON.parse(event.body);
            console.log('Parsed data:', data);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON in request' })
            };
        }

        const { product, size, price, name, phone, address, quantity, notes } = data;

        // Basic validation
        if (!product || !name || !phone || !address) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Get environment variables
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        console.log('Bot Token exists:', !!TELEGRAM_BOT_TOKEN);
        console.log('Chat ID exists:', !!TELEGRAM_CHAT_ID);

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Missing Telegram credentials');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Server configuration error - missing Telegram credentials'
                })
            };
        }

        // Create message
        const message = `
🛒 NEW ORDER - PR SPORT 🛒

Product: ${product}
Size: ${size}
Price: $${price}
Quantity: ${quantity}

Customer Details:
Name: ${name}
Phone: +855${phone}
Address: ${address}

Notes: ${notes || 'None'}

Time: ${new Date().toLocaleString()}
        `.trim();

        console.log('Sending to Telegram...');

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });

        const telegramData = await telegramResponse.json();

        if (telegramResponse.ok) {
            console.log('Telegram success:', telegramData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true,
                    message: 'Order sent to Telegram successfully'
                })
            };
        } else {
            console.error('Telegram error:', telegramData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Failed to send to Telegram',
                    details: telegramData.description || 'Unknown Telegram error'
                })
            };
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};