// Global variables
let beforeImage = null;
let afterImage = null;
let apiKey = localStorage.getItem('anthropicApiKey');

// Initialize app
window.onload = function() {
    if (apiKey) {
        document.getElementById('apiStatus').textContent = '✅ API Key saved! You can start creating posts.';
        document.getElementById('apiStatus').className = 'api-status success';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('apiSetup').style.display = 'none';
    }

    // Update color preview
    document.getElementById('brandColor').addEventListener('input', function(e) {
        document.getElementById('colorPreview').textContent = e.target.value;
    });
};

// Toggle contact info section
function toggleContactFields() {
    const ctaValue = document.getElementById('ctaSelect').value;
    const contactInfo = document.getElementById('contactInfo');
    
    if (ctaValue) {
        contactInfo.style.display = 'block';
    } else {
        contactInfo.style.display = 'none';
    }
}

// Toggle individual contact inputs
function togglePhoneInput() {
    const checkbox = document.getElementById('showPhone');
    const input = document.getElementById('phoneNumber');
    input.style.display = checkbox.checked ? 'block' : 'none';
    if (!checkbox.checked) input.value = '';
}

function toggleEmailInput() {
    const checkbox = document.getElementById('showEmail');
    const input = document.getElementById('emailAddress');
    input.style.display = checkbox.checked ? 'block' : 'none';
    if (!checkbox.checked) input.value = '';
}

function toggleWebsiteInput() {
    const checkbox = document.getElementById('showWebsite');
    const input = document.getElementById('websiteUrl');
    input.style.display = checkbox.checked ? 'block' : 'none';
    if (!checkbox.checked) input.value = '';
}

// Save API Key
function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    const statusEl = document.getElementById('apiStatus');

    if (!key) {
        statusEl.textContent = '❌ Please enter an API key';
        statusEl.className = 'api-status error';
        return;
    }

    if (!key.startsWith('sk-ant-')) {
        statusEl.textContent = '❌ Invalid API key format. Should start with "sk-ant-"';
        statusEl.className = 'api-status error';
        return;
    }

    localStorage.setItem('anthropicApiKey', key);
    apiKey = key;
    statusEl.textContent = '✅ API Key saved successfully!';
    statusEl.className = 'api-status success';

    setTimeout(() => {
        document.getElementById('apiSetup').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }, 1000);
}

// Handle image upload
function handleImageUpload(type) {
    const input = document.getElementById(`${type}Image`);
    const preview = document.getElementById(`${type}Preview`);
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                if (type === 'before') {
                    beforeImage = img;
                } else {
                    afterImage = img;
                }
                preview.innerHTML = `<img src="${e.target.result}" alt="${type} image">`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Improve text with AI
async function improveText() {
    const description = document.getElementById('postDescription').value.trim();
    const improveBtn = document.getElementById('improveBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (!description) {
        alert('Please enter some text first!');
        return;
    }

    if (!apiKey) {
        alert('Please set up your API key first!');
        return;
    }

    // Show loading
    improveBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        console.log('Sending request to Anthropic API...');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `You are a social media copywriting expert. Improve this before/after transformation post to make it engaging, compelling, and shareable for Facebook. Keep it authentic and conversational. Make it concise but impactful. Return ONLY the improved text, no explanations or commentary.

Original text: ${description}`
                }]
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Success! Got response:', data);
        
        const improvedText = data.content[0].text;
        
        document.getElementById('postDescription').value = improvedText;
        
        // Show success message
        alert('✨ Text improved successfully!');

    } catch (error) {
        console.error('Full error:', error);
        
        let errorMessage = '❌ Error improving text.\n\n';
        
        if (error.message.includes('401') || error.message.includes('authentication')) {
            errorMessage += 'Your API key appears to be invalid. Please check it and try again.';
        } else if (error.message.includes('429')) {
            errorMessage += 'Rate limit reached. Please wait a moment and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        
        errorMessage += '\n\nCheck the browser console (F12) for more details.';
        alert(errorMessage);
    } finally {
        improveBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Generate the post
function generatePost() {
    if (!beforeImage || !afterImage) {
        alert('Please upload both before and after images!');
        return;
    }

    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const brandColor = document.getElementById('brandColor').value;
    const description = document.getElementById('postDescription').value.trim();
    const cta = document.getElementById('ctaSelect').value;
    
    // Get contact info
    const showPhone = document.getElementById('showPhone').checked;
    const showEmail = document.getElementById('showEmail').checked;
    const showWebsite = document.getElementById('showWebsite').checked;
    const phone = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('emailAddress').value.trim();
    const website = document.getElementById('websiteUrl').value.trim();
    
    // Collect active contact info
    const contactInfo = [];
    if (showPhone && phone) contactInfo.push({ icon: '📞', text: phone });
    if (showEmail && email) contactInfo.push({ icon: '✉️', text: email });
    if (showWebsite && website) contactInfo.push({ icon: '🌐', text: website });

    // Canvas dimensions
    const padding = 40;
    const imageGap = 30;
    const headerHeight = 80;
    const textHeight = description ? 150 : 0;
    const ctaHeight = cta ? 80 : 0;
    const contactHeight = contactInfo.length > 0 ? (contactInfo.length * 40 + 30) : 0;
    const footerHeight = 50;

    // Calculate image dimensions (make them equal height)
    const targetHeight = 500;
    const beforeWidth = (beforeImage.width / beforeImage.height) * targetHeight;
    const afterWidth = (afterImage.width / afterImage.height) * targetHeight;

    const totalWidth = beforeWidth + afterWidth + imageGap + (padding * 2);
    const totalHeight = headerHeight + targetHeight + textHeight + ctaHeight + contactHeight + footerHeight;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header with brand color
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BEFORE & AFTER', canvas.width / 2, 50);

    let currentY = headerHeight + padding;

    // Before label
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BEFORE', padding + beforeWidth / 2, currentY);

    // After label
    ctx.fillText('AFTER', padding + beforeWidth + imageGap + afterWidth / 2, currentY);

    currentY += 30;

    // Draw images
    ctx.drawImage(beforeImage, padding, currentY, beforeWidth, targetHeight);
    ctx.drawImage(afterImage, padding + beforeWidth + imageGap, currentY, afterWidth, targetHeight);

    currentY += targetHeight + 30;

    // Description text
    if (description) {
        ctx.fillStyle = '#333333';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        
        // Word wrap
        const maxWidth = canvas.width - (padding * 2);
        const words = description.split(' ');
        let line = '';
        let lineY = currentY;
        const lineHeight = 30;

        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, canvas.width / 2, lineY);
                line = word + ' ';
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, canvas.width / 2, lineY);
        currentY = lineY + 40;
    }

    // CTA Button
    if (cta) {
        const ctaWidth = 300;
        const ctaButtonHeight = 60;
        const ctaX = (canvas.width - ctaWidth) / 2;
        const ctaY = currentY;

        // Button
        ctx.fillStyle = brandColor;
        ctx.fillRect(ctaX, ctaY, ctaWidth, ctaButtonHeight);

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cta.toUpperCase(), canvas.width / 2, ctaY + 38);
        
        currentY += ctaButtonHeight + 20;
    }

    // Contact Information
    if (contactInfo.length > 0) {
        ctx.fillStyle = '#333333';
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        
        contactInfo.forEach((contact, index) => {
            const text = `${contact.icon} ${contact.text}`;
            ctx.fillText(text, canvas.width / 2, currentY + (index * 40));
        });
    }

    // Show download button
    document.getElementById('downloadBtn').style.display = 'inline-block';
}

// Download the post
function downloadPost() {
    const canvas = document.getElementById('previewCanvas');
    const link = document.createElement('a');
    link.download = 'before-after-post.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
