document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const msgContainer = document.getElementById('message-container');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Replace these credentials with your actual Telegram Bot details
    const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
    const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

    // Handle file input display
    const fileInput = document.getElementById('payment-screenshot');
    const fileNameDisplay = document.querySelector('.file-name');

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            fileNameDisplay.style.color = 'var(--text-primary)';
        } else {
            fileNameDisplay.textContent = 'Choose an image...';
            fileNameDisplay.style.color = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        // Prevent default page reload
        e.preventDefault();

        // Reset messaging
        msgContainer.textContent = '';
        msgContainer.className = 'message-container';

        // Extract values
        const actionType = document.getElementById('action-type').value;
        const userId = document.getElementById('user-id').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const file = fileInput.files[0];

        if (!actionType || !userId || !amount) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        // Format into text string
        const textMessage = `🔔 *New Transaction Request*
-----------------------------
*Action:* ${actionType}
*User ID:* ${userId}
*Amount:* $${amount}
*Screenshot Attached:* ${file ? 'Yes' : 'No'}
-----------------------------
_Generated from Antigravity Dashboard_`;

        // Update button state visually
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>Processing...</span>`;
        submitBtn.style.opacity = '0.8';
        submitBtn.disabled = true;

        try {
            let url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            let fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: textMessage,
                    parse_mode: 'Markdown'
                })
            };

            // If there's an image, use sendPhoto endpoint with multipart/form-data
            if (file) {
                url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
                const formData = new FormData();
                formData.append('chat_id', TELEGRAM_CHAT_ID);
                formData.append('caption', textMessage);
                formData.append('parse_mode', 'Markdown');
                formData.append('photo', file);

                fetchOptions = {
                    method: 'POST',
                    body: formData
                }; // no headers needed, browser sets the correct boundary for multipart/form-data
            }

            // Fetch request to Telegram API
            const response = await fetch(url, fetchOptions);

            const data = await response.json();

            if (data.ok) {
                // Success
                showMessage('Transaction created successfully!', 'success');
                form.reset();
                fileNameDisplay.textContent = 'Choose an image...';
                fileNameDisplay.style.color = '';
            } else {
                // API Error
                throw new Error(data.description || 'Failed to send message.');
            }

        } catch (error) {
            console.error('Telegram API Error:', error);
            showMessage(`Error: ${error.message} (Is your config set?)`, 'error');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.style.opacity = '1';
            submitBtn.disabled = false;
        }
    });

    function showMessage(msg, type) {
        msgContainer.textContent = msg;
        msgContainer.className = `message-container msg-${type}`;
    }
});
