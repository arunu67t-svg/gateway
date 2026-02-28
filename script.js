document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const msgContainer = document.getElementById('message-container');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Action Type Selector components
    const actionTypeSelect = document.getElementById('action-type');
    const qrSection = document.getElementById('qr-section');
    const depositScreenshotGroup = document.getElementById('deposit-screenshot-group');
    const withdrawalFields = document.getElementById('withdrawal-fields');

    // Withdrawal fields required dynamically
    const bankAcInput = document.getElementById('bank-ac');
    const bankIfscInput = document.getElementById('bank-ifsc');
    const bankNameInput = document.getElementById('bank-name');

    // Replace these credentials with your actual Telegram Bot details
    const TELEGRAM_BOT_TOKEN = '8632514796:AAFB0-FZUx-WSJ9jiqg-h6lOHNWGCXMBx-Q';  // Replaced with your token
    const TELEGRAM_CHAT_ID = '7436313123'; // Replaced with your chat ID

    // Handle initial state
    qrSection.classList.add('hidden-field');
    depositScreenshotGroup.classList.add('hidden-field');

    // Handle action type toggle
    actionTypeSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (selected === 'Deposit') {
            qrSection.classList.remove('hidden-field');
            depositScreenshotGroup.classList.remove('hidden-field');
            withdrawalFields.classList.add('hidden-field');
            // Remove required from withdrawal
            bankAcInput.removeAttribute('required');
            bankIfscInput.removeAttribute('required');
            bankNameInput.removeAttribute('required');
        } else if (selected === 'Withdrawal') {
            qrSection.classList.add('hidden-field');
            depositScreenshotGroup.classList.add('hidden-field');
            withdrawalFields.classList.remove('hidden-field');
            // Add required to withdrawal
            bankAcInput.setAttribute('required', 'true');
            bankIfscInput.setAttribute('required', 'true');
            bankNameInput.setAttribute('required', 'true');
        }
    });

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
        const actionType = actionTypeSelect.value;
        const userId = document.getElementById('user-id').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const file = fileInput.files[0];

        if (!actionType || !userId || !amount) {
            showMessage('Please fill in all general fields.', 'error');
            return;
        }

        // Base message
        let textMessage = `🔔 *New Transaction Request*
-----------------------------
*Action:* ${actionType}
*User ID:* ${userId}
*Amount:* $${amount}\n`;

        // Append specific fields depending on Action Type
        if (actionType === 'Withdrawal') {
            const bankAc = bankAcInput.value.trim();
            const bankIfsc = bankIfscInput.value.trim();
            const bankName = bankNameInput.value.trim();
            const upiId = document.getElementById('upi-id').value.trim();

            textMessage += `*Bank A/C:* \`${bankAc}\`
*IFSC Code:* \`${bankIfsc}\`
*Bank Name:* ${bankName}
*UPI ID:* ${upiId || 'Not provided'}
`;
        } else if (actionType === 'Deposit') {
            textMessage += `*Screenshot Attached:* ${file ? 'Yes' : 'No'}\n`;
        }

        textMessage += `-----------------------------
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

            // If there's an image AND it's a deposit, use sendPhoto endpoint with multipart/form-data
            if (file && actionType === 'Deposit') {
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
                // Reset visibility on success submission
                qrSection.classList.add('hidden-field');
                depositScreenshotGroup.classList.add('hidden-field');
                withdrawalFields.classList.add('hidden-field');
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
