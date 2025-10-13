// Global variables
let beforeImage = null;
let afterImage = null;
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

// Initialize app
window.onload = function() {
    // Show main app immediately - no API key needed
    document.getElementById('settingsPanel').style.display = 'block';
    
    // Load user profile
    loadUserProfile();
    
    // Populate CTA options
    populateCtaOptions();

    // Update color preview
    document.getElementById('brandColor').addEventListener('input', function(e) {
        document.getElementById('colorPreview').textContent = e.target.value;
    });
};

// Load user profile from localStorage
function loadUserProfile() {
    if (userProfile.name) {
        document.getElementById('userName').value = userProfile.name;
    }
    if (userProfile.phone) {
        document.getElementById('userPhone').value = userProfile.phone;
    }
    if (userProfile.email) {
        document.getElementById('userEmail').value = userProfile.email;
    }
    if (userProfile.website) {
        document.getElementById('userWebsite').value = userProfile.website;
    }
}

// Save user profile
function saveUserProfile() {
    userProfile = {
        name: document.getElementById('userName').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        website: document.getElementById('userWebsite').value.trim()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    const statusEl = document.getElementById('profileSaveStatus');
    statusEl.textContent = '✅ Profile saved!';
    statusEl.className = 'save-status success';
    
    // Repopulate CTA options with new name
    populateCtaOptions();
    
    // Auto-fill contact fields
    autoFillContactFields();
    
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

// Populate CTA dropdown dynamically
function populateCtaOptions() {
    const select = document.getElementById('ctaSelect');
    select.innerHTML = '<option value="">No CTA</option>';
    
    // Personal CTAs (only if name is saved)
    if (userProfile.name) {
        const personalGroup = document.createElement('optgroup');
        personalGroup.label = '✨ Personal CTAs';
        
        personalGroup.innerHTML = `
            <option value="Call ${userProfile.name}">Call ${userProfile.name}</option>
            <option value="Text ${userProfile.name}">Text ${userProfile.name}</option>
            <option value="Email ${userProfile.name}">Email ${userProfile.name}</option>
            <option value="Message ${userProfile.name}">Message ${userProfile.name}</option>
            <option value="Visit ${userProfile.name}">Visit ${userProfile.name}</option>
        `;
        select.appendChild(personalGroup);
    }
    
    // Generic CTAs
    const genericGroup = document.createElement('optgroup');
    genericGroup.label = 'Generic CTAs';
    genericGroup.innerHTML = `
        <option value="Learn More">Learn More</option>
        <option value="Shop Now">Shop Now</option>
        <option value="Book Now">Book Now</option>
        <option value="Get Started">Get Started</option>
        <option value="Contact Us">Contact Us</option>
        <option value="Sign Up">Sign Up</option>
        <option value="Try Free">Try Free</option>
        <option value="See Results">See Results</option>
    `;
    select.appendChild(genericGroup);
}

// Auto-fill contact fields from profile
function autoFillContactFields() {
    if (userProfile.phone) {
        document.getElementById('phoneNumber').value = userProfile.phone;
    }
    if (userProfile.email) {
        document.getElementById('emailAddress').value = userProfile.email;
    }
    if (userProfile.website) {
        document.getElementById('websiteUrl').value = userProfile.website;
    }
}

// Toggle contact info section
function toggleContactFields() {
    const ctaValue = document.getElementById('ctaSelect').value;
    const contactInfo = document.getElementById('contactInfo');
    
    if (ctaValue) {
        contactInfo.style.display = 'block';
        // Auto-fill from profile if available
        autoFillContactFields();
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

// Toggle settings visibility
function toggleSettings() {
    const content = document.getElementById('settingsContent');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

// Test API connection (no API key needed - it's in the worker)
async function testApiConnection() {
    const testResult = document.getElementById('testResult');
    testResult.innerHTML = '<em>Testing AI connection...</em>';

    try {
        const response = await fetch('https://claud-proxy.mrpoffice.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 50,
                messages: [{
                    role: 'user',
                    content: 'Reply with just "OK" if you receive this.'
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            testResult.innerHTML = `✅ <strong>AI Connection Successful!</strong><br>Response: "${data.content[0].text}"`;
            testResult.style.color = 'green';
        } else {
            const errorData = await response.json();
            testResult.innerHTML = `❌ <strong>Connection Error ${response.status}:</strong><br>${errorData.error?.message || errorData.message || 'Unknown error'}`;
            testResult.style.color = 'red';
        }
    } catch (error) {
        testResult.innerHTML = `❌ <strong>Connection Failed:</strong><br>${error.message}`;
        testResult.style.color = 'red';
    }
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

    // Show loading
    improveBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        console.log('Sending request to improve text...');
        
        const response = await fetch('https://claud-proxy.mrpoffice.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
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
            throw new Error(`Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
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
            errorMessage += 'Authentication error. Please contact support.';
        } else if (error.message.includes('429')) {
            errorMessage += 'Rate limit reached. Please wait a moment and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        
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

    // Before label - center it properly above the before image
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 32px Arial';  // Increased from 28px to 32px
    ctx.textAlign = 'center';
    const beforeCenterX = padding + (beforeWidth / 2);
    ctx.fillText('BEFORE', beforeCenterX, currentY);

    // After label - center it properly above the after image
    const afterCenterX = padding + beforeWidth + imageGap + (afterWidth / 2);
    ctx.fillText('AFTER', afterCenterX, currentY);

    currentY += 30;

    // Draw images
    ctx.drawImage(beforeImage, padding, currentY, beforeWidth, targetHeight);
    ctx.drawImage(afterImage, padding + beforeWidth + imageGap, currentY, afterWidth, targetHeight);

    currentY += targetHeight + 30;

    // Description text - LARGER FONT
    if (description) {
        ctx.fillStyle = '#333333';
        ctx.font = '28px Arial';  // Increased from 20px to 28px
        ctx.textAlign = 'center';
        
        // Word wrap
        const maxWidth = canvas.width - (padding * 2);
        const words = description.split(' ');
        let line = '';
        let lineY = currentY;
        const lineHeight = 38;  // Increased from 30 to 38 for better spacing

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
        ctx.font = '26px Arial';  // Increased from 22px to 26px
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
