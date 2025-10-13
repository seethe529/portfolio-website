// Contact form handler with rate limiting
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const formMessage = document.getElementById('form-message');
    
    // Rate limiting
    let lastSubmission = 0;
    const RATE_LIMIT = 60000; // 1 minute
    
    function canSubmit() {
        const now = Date.now();
        if (now - lastSubmission < RATE_LIMIT) {
            return false;
        }
        lastSubmission = now;
        return true;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check rate limit
        if (!canSubmit()) {
            formMessage.textContent = 'Please wait 1 minute between submissions.';
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        formMessage.style.display = 'none';

        // Get and optimize form data
        const formData = {
            name: document.getElementById('name').value.trim().substring(0, 100),
            email: document.getElementById('email').value.trim().substring(0, 100),
            subject: document.getElementById('subject').value.trim().substring(0, 200),
            message: document.getElementById('message').value.trim().substring(0, 1000)
        };

        try {
            // Send to API Gateway
            const response = await fetch('https://lpgzsfaxr3.execute-api.us-east-1.amazonaws.com/prod', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success
                formMessage.textContent = 'Message sent successfully! I\'ll get back to you soon.';
                formMessage.className = 'form-message success';
                formMessage.style.display = 'block';
                form.reset();
            } else {
                // Error
                formMessage.textContent = 'Failed to send message. Please try again or contact me via LinkedIn.';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
            }
        } catch (error) {
            // Network error
            formMessage.textContent = 'Network error. Please check your connection and try again.';
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
        }

        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    });
});