// =================== SCALIFY.JS ===================
// Host on GitHub, serve via jsDelivr CDN

var currentPercentage = 0;
var currentPanelNumber = 1;
var currentLeads = 0;
var audioContext;

var robotMessages = {
  'panel-1': "Welcome to Scalify.ai",
  'panel-1b': "What's your business called?",
  'panel-2': "Now scan your current site",
  'panel-3': "Let's improve your site today",
  'panel-4': "Pick your industry!",
  'panel-5': "Choose your style!",
  'panel-6': "Select your colors!",
  'panel-7': "Your new site is ready!",
  'panel-8': "Create your account!"
};

var panelLeads = {
  1: 0, 
  '1b': 25,  // NEW
  2: 50, 
  3: 100, 
  4: 150, 
  5: 200, 
  6: 250, 
  7: 300, 
  8: 350, 
  9: 400, 
  10: 500
};

// ==================== SHARED PANEL TO STEP MAPPING ====================
// PUT THIS AT THE TOP, before updateProgress function
window.panelToStep || {
  '1': 0,    // Panel 1 → BUSINESS (checkpoint 1)
  '1b': 0,   // Panel 1b → BUSINESS (stays at checkpoint 1) ← CHANGED FROM 1 TO 0
  '2': 1,    // Panel 2 → SCAN (checkpoint 2)
  '3': 1,    // Panel 3 → SCAN (stays at checkpoint 2)
  '4': 2,    // Right-panel-4 → INDUSTRY (checkpoint 3)
  '5': 3,    // Right-panel-5 → PACKAGE (checkpoint 4)
  '6': 4,    // Right-panel-6 → SEO (checkpoint 5)
  '7': 5,    // Right-panel-7 → PREVIEW (checkpoint 6)
  '8': 6,    // Right-panel-8 → ACCOUNT (checkpoint 7)
  '9': 7,    // Right-panel-9 → CONTRACT (checkpoint 8)
  '10': 8    // Right-panel-10 → PAY (checkpoint 9)
};

// Load cached image from localStorage on page load
(function() {
  var savedImage = localStorage.getItem('scalify_oldSiteImage');
  var savedUrl = localStorage.getItem('scalify_scannedUrl');
  
  if (savedImage) {
    window.cachedOldSiteImage = savedImage;
    console.log('Loaded cached image from localStorage');
  }
  
  if (savedUrl) {
    window.scannedUrl = savedUrl;
    console.log('Loaded scanned URL from localStorage:', savedUrl);
  }
})();

// ==================== AUDIO FUNCTIONS ====================

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playHealSound() {
  if (!audioContext) return;
  var oscillator = audioContext.createOscillator();
  var gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);  // Was 0.15, now 0.05
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
  setTimeout(function() {
    var sparkle = audioContext.createOscillator();
    var sparkleGain = audioContext.createGain();
    sparkle.connect(sparkleGain);
    sparkleGain.connect(audioContext.destination);
    sparkle.type = 'sine';
    sparkle.frequency.value = 800;
    sparkleGain.gain.setValueAtTime(0.03, audioContext.currentTime);  // Was 0.1, now 0.03
    sparkleGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    sparkle.start();
    sparkle.stop(audioContext.currentTime + 0.2);
  }, 150);
}

function playDamageSound() {
  if (!audioContext) return;
  var oscillator = audioContext.createOscillator();
  var gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.2);
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);  // Was 0.15, now 0.05
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}

function playCashSound() {
  if (!audioContext) return;
  var oscillator = audioContext.createOscillator();
  var gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.05);
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(1400, audioContext.currentTime + 0.15);
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);  // Was 0.15, now 0.05
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.4);
  setTimeout(function() {
    var ching = audioContext.createOscillator();
    var chingGain = audioContext.createGain();
    ching.connect(chingGain);
    chingGain.connect(audioContext.destination);
    ching.type = 'sine';
    ching.frequency.value = 2000;
    chingGain.gain.setValueAtTime(0.03, audioContext.currentTime);  // Was 0.1, now 0.03
    chingGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    ching.start();
    ching.stop(audioContext.currentTime + 0.2);
  }, 200);
}
// Helper function for cleaning business names to URLs
// Helper function for cleaning business names
function sanitizeBusinessNameToUrl(businessName) {
  var cleaned = businessName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(in|at|of|for|near|by)[a-z]+$/i, '')
    .replace(/(northcarolina|southcarolina|newyork|california|texas|florida|pennsylvania|newjersey|virginia|georgia|massachusetts|carolina|inc|llc|ltd|corp|corporation|company|co|group|therapy|aba|clinic|center|services)$/i, '')
    .replace(/[^a-z0-9]/g, '');
  
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }
  
  return cleaned + '.com';
}
function playBuildSound() {
  if (!audioContext) return;
  var oscillator = audioContext.createOscillator();
  var gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(700, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);  // Was 0.1, now 0.03
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

// ==================== LEADS FUNCTIONS ====================

function createSparkles(container, count) {
  for (var i = 0; i < count; i++) {
    var sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    var angle = (Math.PI * 2 * i) / count;
    var distance = 30 + Math.random() * 40;
    sparkle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
    sparkle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
    container.appendChild(sparkle);
    setTimeout(function(s) { s.remove(); }, 800, sparkle);
  }
}

function createFlyingBill(container) {
  var bill = document.createElement('div');
  bill.className = 'flying-bill';
  bill.textContent = '$';
  bill.style.setProperty('--fx', (50 + Math.random() * 100) + 'px');
  bill.style.setProperty('--fy', (-30 - Math.random() * 50) + 'px');
  bill.style.setProperty('--fr', ((Math.random() - 0.5) * 360) + 'deg');
  container.appendChild(bill);
  setTimeout(function() { bill.remove(); }, 1000);
}

function createPopup(parent, amount, isLoss) {
  var popup = document.createElement('div');
  popup.className = 'gain-popup' + (isLoss ? ' loss' : '');
  popup.textContent = (isLoss ? '-' : '+') + '$' + Math.abs(amount);
  parent.appendChild(popup);
  setTimeout(function() { popup.remove(); }, 1000);
}

function updateLeads(targetLeads) {
  var leadNumber = document.getElementById('lead-number');
  var billsStack = document.getElementById('bills-stack');
  var sparkleContainer = document.getElementById('sparkle-container');
  var counter = document.getElementById('lead-counter');
  if (!leadNumber || targetLeads <= currentLeads) return;
  var gain = targetLeads - currentLeads;
  if (billsStack) billsStack.classList.add('adding');
  if (leadNumber) leadNumber.classList.add('pop');
  if (sparkleContainer) createSparkles(sparkleContainer, 8);
  if (counter) createPopup(counter, gain, false);
  playCashSound();
  var start = currentLeads;
  var duration = 1000;
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    leadNumber.textContent = '$' + Math.round(start + (targetLeads - start) * progress);
    if (progress < 1) requestAnimationFrame(step);
    else currentLeads = targetLeads;
  }
  requestAnimationFrame(step);
  setTimeout(function() {
    if (billsStack) billsStack.classList.remove('adding');
    if (leadNumber) leadNumber.classList.remove('pop');
  }, 800);
}

function loseLeads(targetLeads) {
  var leadNumber = document.getElementById('lead-number');
  var billsStack = document.getElementById('bills-stack');
  var counter = document.getElementById('lead-counter');
  var warning = document.getElementById('leads-warning');
  if (!leadNumber || targetLeads >= currentLeads) return;
  var loss = currentLeads - targetLeads;
  var warnings = ["LOSING LEADS!", "CLIENTS LEAVING!", "MONEY LOST!", "LEADS ESCAPING!"];
  if (billsStack) billsStack.classList.add('losing');
  if (leadNumber) leadNumber.classList.add('drop');
  if (counter) counter.classList.add('shake');
  if (billsStack) {
    for (var i = 0; i < 3; i++) {
      setTimeout(function() { createFlyingBill(billsStack); }, i * 150);
    }
  }
  if (counter) createPopup(counter, loss, true);
  if (warning) {
    warning.textContent = warnings[Math.floor(Math.random() * warnings.length)];
    warning.classList.add('active');
  }
  playDamageSound();
  var start = currentLeads;
  var duration = 1000;
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    leadNumber.textContent = '$' + Math.round(start + (targetLeads - start) * progress);
    if (progress < 1) requestAnimationFrame(step);
    else currentLeads = targetLeads;
  }
  requestAnimationFrame(step);
  setTimeout(function() {
    if (billsStack) billsStack.classList.remove('losing');
    if (leadNumber) leadNumber.classList.remove('drop');
    if (counter) counter.classList.remove('shake');
    if (warning) warning.classList.remove('active');
  }, 1500);
}

function animateNumber(element, start, target) {
  var duration = 1000;
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var current = Math.round(start + (target - start) * progress);
    element.textContent = current + '/9';
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


// ==================== UPDATE PROGRESS ====================
window.updateProgress = function(panelNumber, direction) {
  console.log('====== UPDATE PROGRESS CALLED ======');
  console.log('Panel Number:', panelNumber);
  console.log('Direction:', direction);
  
  var totalSteps = 8;
  
  if (!window.panelToStep) {
    window.panelToStep = {
      '1': 0,
      '1b': 0,
      '2': 1,
      '3': 1,
      '4': 2,
      '5': 3,
      '6': 4,
      '7': 5,
      '8': 6,
      '9': 7,
      '10': 8
    };
  }
  
  var panelId = String(panelNumber);
  var currentStep = window.panelToStep[panelId];
  
  console.log('Panel ID:', panelId);
  console.log('Current Step from mapping:', currentStep);
  
  if (currentStep === undefined) {
    currentStep = Math.min(panelNumber - 1, totalSteps);
    console.log('Using fallback step:', currentStep);
  }
  
  var fillPercentage = (currentStep / totalSteps) * 100;
  
  console.log('Fill Percentage:', fillPercentage + '%');
  console.log('====================================');
  
  var progressFill = document.querySelector('.progress-fill');
  if (progressFill) progressFill.style.width = fillPercentage + '%';
  
  var progressNumber = document.querySelector('.progress-number');
  if (progressNumber) animateNumber(progressNumber, currentPercentage, currentStep);
  
  if (direction === 'forward' && currentStep > 0) {
    playHealSound();
    var targetLeads = panelLeads[panelNumber] || 0;
    if (targetLeads > currentLeads) {
      setTimeout(function() { updateLeads(targetLeads); }, 500);
    }
  }
  currentPercentage = currentStep;
};
// ==================== ROBOT & PANELS ====================

var currentTypeInterval = null;

window.showRobotMessage = function(panelId) {
  var bubble = document.querySelector('.speech-bubble');
  var text = document.querySelector('.speech-text');
  if (!bubble || !text) return;
  
  // Clear any existing typing interval first
  if (currentTypeInterval) {
    clearInterval(currentTypeInterval);
    currentTypeInterval = null;
  }
  
  var message = robotMessages[panelId];
  if (message) {
    bubble.classList.remove('active');
    setTimeout(function() {
      text.textContent = '';
      bubble.classList.add('active');
      var i = 0;
      currentTypeInterval = setInterval(function() {
        if (i < message.length) {
          text.textContent += message[i];
          i++;
        } else {
          clearInterval(currentTypeInterval);
          currentTypeInterval = null;
        }
      }, 50);
    }, 300);
  }
};

function scaleRobot(panelNumber) {
  var splineContainer = document.querySelector('.spline-container');
  var speechBubble = document.querySelector('.speech-bubble');
  var rightContent = document.querySelector('.right-content');
  
  if (panelNumber >= 3) {
    if (splineContainer) splineContainer.classList.add('hidden');
    if (speechBubble) speechBubble.classList.add('hidden');
    if (rightContent) rightContent.classList.add('expanded');
  } else {
    if (splineContainer) splineContainer.classList.remove('hidden');
    if (speechBubble) speechBubble.classList.remove('hidden');
    if (rightContent) rightContent.classList.remove('expanded');
  }
}

function showRightContent(panelNumber) {
  var rightContent = document.querySelector('.right-content');
  if (!rightContent) return;
  if (panelNumber >= 3) rightContent.classList.add('active');
  else rightContent.classList.remove('active');
}

function switchRightPanel(panelNumber) {
  var currentRightPanel = document.querySelector('.right-panel.active');
  var nextRightPanel = document.getElementById('right-panel-' + panelNumber);
  showRightContent(panelNumber);
  scaleRobot(panelNumber);
  if (panelNumber < 3) return;
  if (currentRightPanel) {
    currentRightPanel.style.opacity = '0';
    currentRightPanel.style.transform = 'translateY(20px)';
    setTimeout(function() {
      currentRightPanel.classList.remove('active');
      currentRightPanel.style.opacity = '';
      currentRightPanel.style.transform = '';
      if (nextRightPanel) nextRightPanel.classList.add('active');
    }, 500);
  } else if (nextRightPanel) {
    nextRightPanel.classList.add('active');
  }
}
// ==================== PREVIEW UPDATE FUNCTIONS ====================
function preloadAndSet(imgElement, newSrc) {
  if (!imgElement || !newSrc) return;
  var preload = new Image();
  preload.onload = function() {
    imgElement.removeAttribute('srcset');
    imgElement.removeAttribute('sizes');
    imgElement.src = newSrc;
  };
  preload.src = newSrc;
}

function updateIndustryPreview() {
  var industry = window.siteConfig.industry;
  if (!industry) return;

  var headline = document.getElementById('preview-headline');
  var description = document.getElementById('preview-description');
  var cta = document.getElementById('preview-cta');
  var navCta = document.getElementById('preview-nav-cta');
  var image = document.getElementById('preview-image');
  var img5k = document.getElementById('template-5k');
  var img10k = document.getElementById('template-10k');
  var img50k = document.getElementById('template-50k');

  if (headline && industry.headline) headline.innerHTML = industry.headline;
  if (description && industry.description) description.innerHTML = industry.description;
  if (cta && industry.cta) cta.innerHTML = industry.cta;
  if (navCta && industry.cta) navCta.innerHTML = industry.cta;

  // Preload all images before swapping
  preloadAndSet(image, industry.image);
  preloadAndSet(img5k, industry.template5k);
  preloadAndSet(img10k, industry.template10k);
  preloadAndSet(img50k, industry.template50k);

  // Persist for logged-in users only
  if (window.$memberstackDom) {
    window.$memberstackDom.getCurrentMember().then(function(result) {
      if (result && result.data) {
        try {
          localStorage.setItem('scalify_selectedIndustry', JSON.stringify(industry));
        } catch (e) {}
      }
    });
  }
}

// Restore industry on page load for logged-in users only
function restoreIndustrySelection() {
  if (!window.$memberstackDom) return;
  window.$memberstackDom.getCurrentMember().then(function(result) {
    if (!result || !result.data) return;
    try {
      var saved = localStorage.getItem('scalify_selectedIndustry');
      if (!saved) return;
      var industry = JSON.parse(saved);
      if (!industry || !industry.slug) return;
      if (!window.siteConfig) window.siteConfig = {};
      window.siteConfig.industry = industry;
      window.selectedIndustrySlug = industry.slug;
      updateIndustryPreview();
      
      function forceTemplateImage() {
        var img = document.getElementById('template-5k');
        if (img && industry.template5k) {
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          img.src = industry.template5k;
        }
      }
      
      forceTemplateImage();
      setTimeout(forceTemplateImage, 500);
      setTimeout(forceTemplateImage, 1000);
      setTimeout(forceTemplateImage, 2500);
      
      var cards = document.querySelectorAll('.industry-card');
      cards.forEach(function(card) {
        if (card.getAttribute('data-slug') === industry.slug) {
          card.classList.add('selected');
        }
      });
      console.log('[Industry] Restored selection:', industry.slug);
    } catch (e) {}
  });
}
// Run restore when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreIndustrySelection);
} else {
  restoreIndustrySelection();
}
function updateStylePreview() {
  var style = window.siteConfig.style;
  if (!style) return;
  var fonts = {
    'font-modern': "Inter, sans-serif",
    'font-classic': "Playfair Display, serif",
    'font-friendly': "Nunito, sans-serif",
    'font-bold': "Poppins, sans-serif",
    'font-playful': "Quicksand, sans-serif"
  };
  var fontFamily = fonts[style.fontClass];
  if (!fontFamily) return;
  var headline = document.getElementById('preview-headline');
  var description = document.getElementById('preview-description');
  var cta = document.getElementById('preview-cta');
  var navCta = document.getElementById('preview-nav-cta');
  var image = document.getElementById('preview-image');
  if (headline) headline.style.setProperty('font-family', fontFamily, 'important');
  if (description) description.style.setProperty('font-family', fontFamily, 'important');
  if (cta) {
    cta.style.setProperty('font-family', fontFamily, 'important');
    if (style.buttonRadius) cta.style.setProperty('border-radius', style.buttonRadius, 'important');
  }
  if (navCta) {
    navCta.style.setProperty('font-family', fontFamily, 'important');
    if (style.buttonRadius) navCta.style.setProperty('border-radius', style.buttonRadius, 'important');
  }
  if (image && style.radius) image.style.setProperty('border-radius', style.radius, 'important');
}

function updateColorPreview() {
  var colors = window.siteConfig.colors;
  if (!colors) return;
  var headline = document.getElementById('preview-headline');
  var description = document.getElementById('preview-description');
  var cta = document.getElementById('preview-cta');
  var navCta = document.getElementById('preview-nav-cta');
  var logo = document.getElementById('preview-logo');
  var navLinks = document.getElementById('preview-nav-links');
  var hero = document.getElementById('preview-hero');
  if (headline && colors.primary) headline.style.setProperty('color', colors.primary, 'important');
  if (description && colors.secondary) description.style.setProperty('color', colors.secondary, 'important');
  if (cta && colors.accent) {
    cta.style.setProperty('background-color', colors.accent, 'important');
    cta.style.setProperty('color', '#ffffff', 'important');
  }
  if (navCta && colors.primary) {
    navCta.style.setProperty('background-color', colors.primary, 'important');
    navCta.style.setProperty('color', '#ffffff', 'important');
  }
  if (logo && colors.primary) logo.style.setProperty('color', colors.primary, 'important');
  if (navLinks && colors.secondary) {
    navLinks.querySelectorAll('a, span').forEach(function(link) {
      link.style.setProperty('color', colors.secondary, 'important');
    });
  }
  if (hero && colors.primary) hero.style.setProperty('background-color', colors.primary + '10', 'important');
}

function loadOldSiteScreenshot() {
  var img = document.getElementById('old-site-screenshot');
  if (img && window.screenshotUrl) {
    img.onload = function() { img.style.opacity = '1'; };
    img.src = window.screenshotUrl;
  }
}

// ZAPIER FUNCTION
(function() {
  var ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/6690142/u0ytuah/';

  function gatherUserData() {
    var email = '';
    var name = '';
    var phone = '';
    var companyName = '';

    var emailInput = document.getElementById('Email') || document.querySelector('input[type="email"]');
    var nameInput = document.getElementById('Name') || document.querySelector('input[name="name"]');
    var phoneInput = document.getElementById('Phone') || document.querySelector('input[type="tel"]');
    var companyInput = document.querySelector('input[data-ms-member="company-name"], input[name="Company Name"]');

    if (emailInput && emailInput.value) email = emailInput.value.trim();
    if (nameInput && nameInput.value) name = nameInput.value.trim();
    if (phoneInput && phoneInput.value) phone = phoneInput.value.trim();
    if (companyInput && companyInput.value) companyName = companyInput.value.trim();

    if (!email) email = localStorage.getItem('scalify_paymentEmail') || '';

    var industryName = '';
    try {
      var savedIndustry = JSON.parse(localStorage.getItem('scalify_selectedIndustry'));
      if (savedIndustry) {
        industryName = savedIndustry.name || savedIndustry.slug || savedIndustry.headline || '';
      }
    } catch(e) {}

    if (!industryName && window.siteConfig && window.siteConfig.industry) {
      industryName = window.siteConfig.industry.name || window.siteConfig.industry.slug || '';
    }

    if (!industryName && window.selectedIndustry) {
      industryName = window.selectedIndustry.name || window.selectedIndustry.industry || '';
    }

    var tier = '';
    var price = '';
    if (window.cart) {
      tier = window.cart.tier || '';
      price = window.cart.price || '';
    }

    var businessName = '';
    if (window.businessData && window.businessData.name) businessName = window.businessData.name;
    if (!businessName) businessName = localStorage.getItem('scalify_businessName') || '';

    var scannedUrl = window.scannedUrl || localStorage.getItem('scalify_scannedUrl') || '';
    if (scannedUrl === 'skipped') scannedUrl = 'No existing website';

    return {
      email: email,
      name: name,
      phone: phone,
      company_name: companyName,
      business_name: businessName,
      industry: industryName,
      tier: tier,
      price: price,
      old_site_url: scannedUrl,
      signup_date: new Date().toISOString()
    };
  }

  function sendToZapier(data) {
    fetch(ZAPIER_WEBHOOK, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
  }

  window.sendToZapier = function() {
    sendToZapier(gatherUserData());
  };

   window.sendToZapierDirect = function(email, name, phone, company) {
    var data = gatherUserData();
    data.email = email || data.email;
    data.name = name || data.name;
    data.phone = phone || data.phone;
    data.company_name = company || data.company_name;
    sendToZapier(data);
  };

  function handleMemberstackData() {
    if (!window.$memberstackDom) return;
    window.$memberstackDom.getCurrentMember().then(function(payload) {
      if (!payload || !payload.data) return;
      var memberId = payload.data.id;
      var sentKey = 'scalify_signupSent_' + memberId;
      if (localStorage.getItem(sentKey) === 'true') return;

      var data = gatherUserData();
      if (payload.data.auth) data.email = payload.data.auth.email || data.email;
      if (payload.data.customFields) {
        data.name = payload.data.customFields['name'] || data.name;
        data.phone = payload.data.customFields['phone'] || data.phone;
        data.company_name = payload.data.customFields['company-name'] || data.company_name;
      }
      if (data.email) {
        sendToZapier(data);
        localStorage.setItem(sentKey, 'true');
      }
    }).catch(function() {});
  }

  document.addEventListener('memberstack:authenticated', function() {
    if (window._zapierSentDirect) return; 
    setTimeout(handleMemberstackData, 2000);
  });

  var rp9 = document.getElementById('right-panel-9');
  if (rp9) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.target.id === 'right-panel-9' && !mutation.target.classList.contains('active')) {
          setTimeout(handleMemberstackData, 2000);
        }
      });
    }).observe(rp9, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('memberstack:logout', function() {
    var keys = Object.keys(localStorage);
    keys.forEach(function(key) {
      if (key.startsWith('scalify_signupSent_')) localStorage.removeItem(key);
    });
  });
})();

// ==================== MEMBERSTACK AUTH HANDLER ====================
(function() { 
  window.isLoggedInUser = false;
  
  var checkMemberstack = setInterval(function() {
    if (window.$memberstackDom) {
      clearInterval(checkMemberstack);
      initMemberstackAuth();
    }
  }, 100);
  
  function initMemberstackAuth() {
    var loadingScreen = document.getElementById('auth-loading');
    
    window.$memberstackDom.getCurrentMember().then(function(result) {
      var member = result.data;
      if (member) {
        console.log('User already logged in:', member);
        window.isLoggedInUser = true;
        
        var panel1 = document.getElementById('panel-1');
        if (panel1) panel1.style.display = 'none';
        var mockup = document.querySelector('.website-mockup');
        if (mockup) mockup.style.display = 'none';
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        
        showLoggedInState(member);
        loadSavedSite(member);
        forceToPanel9();
        
        setTimeout(function() {
          if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(function() {
              loadingScreen.style.display = 'none';
            }, 500);
          }
        }, 1500);
        
      } else {
        console.log('New user - showing start screen');
      }
    }).catch(function(error) {
      console.log('Auth error - showing start screen');
    });
    
    setTimeout(function() {
      var signupForm = document.querySelector('[data-ms-form="signup"]');
      if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          var emailInput = signupForm.querySelector('input[type="email"], input[data-ms-member="email"]');
          var passwordInput = signupForm.querySelector('input[type="password"], input[data-ms-member="password"]');
          var nameInput = signupForm.querySelector('input[data-ms-member\\:custom-fields="name"]');
          var companyInput = signupForm.querySelector('input[data-ms-member\\:custom-fields="company-name"]');
          
          if (!nameInput || !companyInput) {
            signupForm.querySelectorAll('input[type="text"]').forEach(function(input) {
              var placeholder = (input.placeholder || '').toLowerCase();
              if (placeholder.includes('name') && !placeholder.includes('company')) {
                if (!nameInput) nameInput = input;
              }
              if (placeholder.includes('company')) {
                if (!companyInput) companyInput = input;
              }
            });
          }
          
          var email = emailInput ? emailInput.value : '';
          var password = passwordInput ? passwordInput.value : '';
          var name = nameInput ? nameInput.value : '';
          var company = companyInput ? companyInput.value : '';
          var phone = document.getElementById('Phone') ? document.getElementById('Phone').value : '';
          
          console.log('Signup data:', { email: email, name: name, company: company });
          
          if (!email || !password) {
            alert('Please enter email and password');
            return false;
          }
          
          var submitBtn = signupForm.querySelector('button[type="submit"]');
          var originalText = submitBtn ? submitBtn.textContent : '';
          if (submitBtn) {
            submitBtn.textContent = 'CREATING...';
            submitBtn.disabled = true;
          }
          
          window.$memberstackDom.signupMemberEmailPassword({
            email: email,
            password: password,
            customFields: { 
  'name': name, 
  'company-name': company, 
  'phone': (document.getElementById('Phone') ? document.getElementById('Phone').value : '')
}
          }).then(function(result) {
    console.log('Signup successful:', result);
    var member = result.data.member;
    window.isLoggedInUser = true;
    window._zapierSentDirect = true;  // ADD THIS
    showLoggedInState(member);
    saveSiteToMember();
    
    // Send to Zapier BEFORE hiding the form
    if (typeof window.sendToZapierDirect === 'function') {
      window.sendToZapierDirect(email, name, phone, company);
    }
    
    forceToPanel9();
}).catch(function(error) {
            console.error('Signup error:', error);
            alert('Signup failed: ' + (error.message || 'Please try again'));
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          });
          return false;
        }, true);
        console.log('Signup form handler attached');
      }
      
      var loginForm = document.querySelector('[data-ms-form="login"]');
      if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          var emailInput = loginForm.querySelector('input[type="email"], input[data-ms-member="email"]');
          var passwordInput = loginForm.querySelector('input[type="password"], input[data-ms-member="password"]');
          var email = emailInput ? emailInput.value : '';
          var password = passwordInput ? passwordInput.value : '';
          
          if (!email || !password) {
            alert('Please enter email and password');
            return false;
          }
          
          var submitBtn = loginForm.querySelector('button[type="submit"]');
          var originalText = submitBtn ? submitBtn.textContent : '';
          if (submitBtn) {
            submitBtn.textContent = 'LOGGING IN...';
            submitBtn.disabled = true;
          }
          
          window.$memberstackDom.loginMemberEmailPassword({
            email: email,
            password: password
          }).then(function(result) {
            console.log('Login successful:', result);
            var member = result.data.member;
            window.isLoggedInUser = true;
            showLoggedInState(member);
            loadSavedSite(member);
            forceToPanel9();
          }).catch(function(error) {
            console.error('Login error:', error);
            alert('Login failed: ' + (error.message || 'Please try again'));
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          });
          return false;
        }, true);
        console.log('Login form handler attached');
      }
    }, 1000);
  }
  
 function forceToPanel9() {
    console.log('=== FORCING TO PANEL ===');
    
    var stepIndicator = document.querySelector('.step-indicator');
    if (stepIndicator) stepIndicator.style.display = 'none';
    var mockup = document.querySelector('.website-mockup');
    if (mockup) mockup.style.display = 'none';
    
    var splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hidden');
    
    document.querySelectorAll('.content-panel').forEach(function(p) {
      if (p.id !== 'panel-4') p.classList.remove('active');
    });
    var panel4 = document.getElementById('panel-4');
    if (panel4) panel4.classList.add('active');
    
    document.querySelectorAll('.right-panel').forEach(function(p) {
      p.classList.remove('active');
    });
    
    var contractSigned = localStorage.getItem('scalify_contractSigned') === 'true';
    
    if (contractSigned) {
      console.log('Contract already signed - going to panel 10');
      var panel10 = document.getElementById('right-panel-10');
      if (panel10) {
        panel10.classList.add('active');
        panel10.style.opacity = '1';
        panel10.style.transform = 'translateY(0)';
      }
      currentPanelNumber = 10;
    } else {
      console.log('Contract not signed - going to panel 9');
      var panel9 = document.getElementById('right-panel-9');
      if (panel9) {
        panel9.classList.add('active');
        panel9.style.opacity = '1';
        panel9.style.transform = 'translateY(0)';
      }
      currentPanelNumber = 9;
    }
    
    setTimeout(function() {
      var newSiteTab = document.getElementById('tabs-new-site');
      if (newSiteTab) {
        console.log('Switching to new site tab');
        newSiteTab.click();
      }
    }, 100);
    
    var tooltips = document.getElementById('Industry-tooltips');
    if (tooltips) {
      tooltips.style.display = 'none';
    }
    
    var splineContainer = document.querySelector('.spline-container');
    var speechBubble = document.querySelector('.speech-bubble');
    var rightContent = document.querySelector('.right-content');
    if (splineContainer) splineContainer.classList.add('hidden');
    if (speechBubble) speechBubble.classList.add('hidden');
    if (rightContent) {
      rightContent.classList.add('active');
      rightContent.classList.add('expanded');
    }
    
    var pipWindow = document.getElementById('old-site-pip');
    if (pipWindow) {
      pipWindow.style.display = 'block';
      pipWindow.style.opacity = '1';
      pipWindow.style.visibility = 'visible';
    }
    
    // Update progress
    if (typeof window.updateProgress === 'function') {
      window.updateProgress(currentPanelNumber, 'forward');
    } else {
      var progressFill = document.querySelector('.progress-fill');
      if (progressFill) progressFill.style.width = contractSigned ? '100%' : '87.5%';
      var progressNumber = document.querySelector('.progress-number');
      if (progressNumber) progressNumber.textContent = contractSigned ? '9/9' : '8/9';
    }
    
    // Update leads
    currentLeads = panelLeads[9] || 500;
    var leadNumber = document.getElementById('lead-number');
    if (leadNumber) leadNumber.textContent = '$' + currentLeads;
    
    setTimeout(function() {
      var pipImg = document.querySelector('#old-site-pip img');
      if (pipImg && window.screenshotUrl) {
        pipImg.src = window.screenshotUrl;
        pipImg.style.opacity = '1';
        console.log('PIP image set to:', window.screenshotUrl);
      } else if (pipImg && window.cachedOldSiteImage) {
        pipImg.src = window.cachedOldSiteImage;
        pipImg.style.opacity = '1';
        console.log('PIP image set from cache');
      }
    }, 500);
  }

  // ADD THIS after forceToPanel9's closing }
  
  function showLoggedInState(member) {
    var name = member.customFields?.name || member.auth?.email?.split('@')[0] || 'User';
    var email = member.auth?.email || '';
    var userIndicator = document.getElementById('user-indicator');
    var userName = document.getElementById('user-name');
    if (userIndicator && userName) {
      userName.textContent = name;
      userIndicator.classList.add('active');
    }
    var orderUserName = document.getElementById('order-user-name');
    if (orderUserName) orderUserName.textContent = name;
    var orderUserEmail = document.getElementById('order-user-email');
    if (orderUserEmail) orderUserEmail.textContent = email;
  }
  
  function saveSiteToMember() {
    if (!window.siteConfig) return;
    var siteData = {
      scannedUrl: window.scannedUrl || '',
      industry: window.siteConfig.industry || null,
      style: window.siteConfig.style || null,
      colors: window.siteConfig.colors || null,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    window.$memberstackDom.updateMember({
      customFields: { 'saved-site': JSON.stringify(siteData) }
    }).then(function() {
      console.log('Site config saved to member:', siteData);
    }).catch(function(err) {
      console.error('Failed to save site config:', err);
    });
  }
    
 function loadSavedSite(member) {
    var savedSite = member.customFields?.['saved-site'];
    if (!savedSite) {
      console.log('No saved site found');
      return;
    }
    try {
      var config = JSON.parse(savedSite);
      console.log('Loading saved site config:', config);
      
      window.scannedUrl = config.scannedUrl || '';
      if (!window.siteConfig) window.siteConfig = { industry: null, style: null, colors: null };
      window.siteConfig.industry = config.industry;
      window.siteConfig.style = config.style;
      window.siteConfig.colors = config.colors;
      
      if (config.scannedUrl) {
        var apiKey = 'VjNKeFlX';
        window.screenshotUrl = 'https://api.screenshotone.com/take?url=' + encodeURIComponent(config.scannedUrl) + '&viewport_width=1280&viewport_height=800&format=png&block_ads=true&block_trackers=true&cache=true&cache_ttl=86400&access_key=' + apiKey;
        window.cachedOldSiteImage = window.screenshotUrl;
      }
      
      // Update URLs now that scannedUrl is set
      if (typeof window.updateSiteUrls === 'function') {
        setTimeout(window.updateSiteUrls, 200);
      }
      
      function applyPreview() {
        console.log('Applying saved preview...');
        if (window.siteConfig.industry) {
          var headline = document.getElementById('preview-headline');
          var description = document.getElementById('preview-description');
          var cta = document.getElementById('preview-cta');
          var navCta = document.getElementById('preview-nav-cta');
          var image = document.getElementById('preview-image');
          if (headline && window.siteConfig.industry.headline) headline.innerHTML = window.siteConfig.industry.headline;
          if (description && window.siteConfig.industry.description) description.innerHTML = window.siteConfig.industry.description;
          if (cta && window.siteConfig.industry.cta) cta.innerHTML = window.siteConfig.industry.cta;
          if (navCta && window.siteConfig.industry.cta) navCta.innerHTML = window.siteConfig.industry.cta;
          if (image && window.siteConfig.industry.image) image.src = window.siteConfig.industry.image;
        }
        if (window.siteConfig.style) {
          var fonts = {
            'font-modern': "Inter, sans-serif",
            'font-classic': "Playfair Display, serif",
            'font-friendly': "Nunito, sans-serif",
            'font-bold': "Poppins, sans-serif",
            'font-playful': "Quicksand, sans-serif"
          };
          var fontFamily = fonts[window.siteConfig.style.fontClass];
          var headline = document.getElementById('preview-headline');
          var description = document.getElementById('preview-description');
          var cta = document.getElementById('preview-cta');
          var navCta = document.getElementById('preview-nav-cta');
          var image = document.getElementById('preview-image');
          if (fontFamily) {
            if (headline) headline.style.setProperty('font-family', fontFamily, 'important');
            if (description) description.style.setProperty('font-family', fontFamily, 'important');
            if (cta) cta.style.setProperty('font-family', fontFamily, 'important');
            if (navCta) navCta.style.setProperty('font-family', fontFamily, 'important');
          }
          if (cta && window.siteConfig.style.buttonRadius) cta.style.setProperty('border-radius', window.siteConfig.style.buttonRadius, 'important');
          if (navCta && window.siteConfig.style.buttonRadius) navCta.style.setProperty('border-radius', window.siteConfig.style.buttonRadius, 'important');
          if (image && window.siteConfig.style.radius) image.style.setProperty('border-radius', window.siteConfig.style.radius, 'important');
        }
        if (window.siteConfig.colors) {
          var headline = document.getElementById('preview-headline');
          var description = document.getElementById('preview-description');
          var cta = document.getElementById('preview-cta');
          var navCta = document.getElementById('preview-nav-cta');
          var logo = document.getElementById('preview-logo');
          if (headline && window.siteConfig.colors.primary) headline.style.setProperty('color', window.siteConfig.colors.primary, 'important');
          if (description && window.siteConfig.colors.secondary) description.style.setProperty('color', window.siteConfig.colors.secondary, 'important');
          if (cta && window.siteConfig.colors.accent) {
            cta.style.setProperty('background-color', window.siteConfig.colors.accent, 'important');
            cta.style.setProperty('color', '#ffffff', 'important');
          }
          if (navCta && window.siteConfig.colors.primary) {
            navCta.style.setProperty('background-color', window.siteConfig.colors.primary, 'important');
            navCta.style.setProperty('color', '#ffffff', 'important');
          }
          if (logo && window.siteConfig.colors.primary) logo.style.setProperty('color', window.siteConfig.colors.primary, 'important');
        }
        var pipWindow = document.getElementById('old-site-pip');
        var pipImg = document.querySelector('#old-site-pip img');
        if (pipWindow) {
          pipWindow.style.display = 'block';
          pipWindow.style.opacity = '1';
          pipWindow.style.visibility = 'visible';
        }
        if (pipImg && window.cachedOldSiteImage) {
          pipImg.src = window.cachedOldSiteImage;
          pipImg.style.opacity = '1';
        }
      }
      
      setTimeout(applyPreview, 100);
      setTimeout(applyPreview, 500);
      setTimeout(applyPreview, 1000);
      setTimeout(applyPreview, 2000);
    } catch(e) {
      console.log('Error parsing saved site:', e);
    }
  }
  
  window.goToPanel = function(panelNum) {
    var currentPanel = document.querySelector('.right-panel.active');
    var nextPanel = document.getElementById('right-panel-' + panelNum);
    if (currentPanel) {
      currentPanel.style.opacity = '0';
      currentPanel.style.transform = 'translateY(20px)';
      setTimeout(function() {
        currentPanel.classList.remove('active');
        currentPanel.style.opacity = '';
        currentPanel.style.transform = '';
        if (nextPanel) nextPanel.classList.add('active');
      }, 500);
    } else if (nextPanel) {
      nextPanel.classList.add('active');
    }
    if (typeof window.updateProgress === 'function') window.updateProgress(panelNum, 'forward');
    currentPanelNumber = panelNum;
    if (typeof window.showRobotMessage === 'function') window.showRobotMessage('panel-' + panelNum);
  };
  
  setTimeout(function() {
    var userIndicator = document.getElementById('user-indicator');
    var settingsDropdown = document.getElementById('settings-dropdown');
    var logoutBtn = document.getElementById('logout-btn'); // CHANGED from 'settings-logout'
    
    // Make entire user indicator clickable
    if (userIndicator && settingsDropdown) {
      userIndicator.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!userIndicator.contains(e.target)) { // CHANGED from .user-settings
          settingsDropdown.classList.remove('active');
        }
      });
    }
    
    // Logout button handler
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // ADDED - prevents dropdown from toggling
        if (settingsDropdown) settingsDropdown.classList.remove('active');
        
        if (confirm('Are you sure you want to log out?')) {
          // Clear localStorage
          localStorage.removeItem('scalify_oldSiteImage');
          localStorage.removeItem('scalify_scannedUrl');
          
          window.$memberstackDom.logout().then(function() {
            window.isLoggedInUser = false;
            var userIndicator = document.getElementById('user-indicator');
            if (userIndicator) userIndicator.classList.remove('active');
            window.location.reload();
          });
        }
      });
    }
  }, 500);
})();

// ==================== DOM CONTENT LOADED ====================
document.addEventListener('DOMContentLoaded', function() {
  window.siteConfig = { industry: null, style: null, colors: null };
  
  // Show progress bar on all panels except panel-1
  setInterval(function() {
    var panel1 = document.getElementById('panel-1');
    var progressWrapper = document.querySelector('.progress-wrapper');
    
    if (progressWrapper) {
      if (panel1 && panel1.classList.contains('active')) {
        progressWrapper.classList.remove('visible');
      } else {
        progressWrapper.classList.add('visible');
      }
    }
  }, 300);
  
  // Show lead counter from panel 6 onwards
  setInterval(function() {
    var rightPanel = document.querySelector('.right-panel.active');
    var leadCounter = document.getElementById('lead-counter');
    var rightPanelNum = 0;
    
    if (rightPanel && rightPanel.id) {
      var match = rightPanel.id.match(/right-panel-(\d+)/);
      if (match) rightPanelNum = parseInt(match[1]);
    }
    
    if (leadCounter) {
      if (rightPanelNum >= 6) {
        leadCounter.classList.add('visible');
      } else {
        leadCounter.classList.remove('visible');
      }
    }
  }, 300);
  
  // ==========================================
  // URL UPDATER - event-driven
  // ==========================================
  function updateSiteUrls() {
    var scannedUrl = window.scannedUrl || localStorage.getItem('scalify_scannedUrl');
    
    var displayUrl;
    
    if (scannedUrl && scannedUrl !== 'skipped') {
      var cleanUrl = scannedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
      displayUrl = 'https://www.' + cleanUrl;
    } else {
      displayUrl = 'https://www.your-new-website.com';
    }
    
    console.log('[URL Updater] displayUrl:', displayUrl);
    
var newSiteUrlById = document.getElementById('new-site-url-new');
    if (newSiteUrlById) {
      newSiteUrlById.textContent = displayUrl;
    }
    
    var newSiteUrlsByClass = document.querySelectorAll('.new-site-url');
    newSiteUrlsByClass.forEach(function(el) {
      el.textContent = displayUrl;
    });
  }
  window.updateSiteUrls = updateSiteUrls;
  
  // Listen for scan/skip events from scanning embed
  window.addEventListener('scalify:urlScanned', updateSiteUrls);
  
  // BACK BUTTONS
  document.querySelectorAll('.back-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var goTo = this.getAttribute('data-go-to');
      if (!goTo) return;
      var targetPanelNumber = parseInt(goTo.replace('panel-', ''));
      var rightOnly = this.getAttribute('data-right-only') === 'true';
      
      if (rightOnly) {
        var currentRightPanel = document.querySelector('.right-panel.active');
        var nextRightPanel = document.getElementById('right-' + goTo);
        if (currentRightPanel) {
          currentRightPanel.style.opacity = '0';
          currentRightPanel.style.transform = 'translateY(20px)';
          setTimeout(function() {
            currentRightPanel.classList.remove('active');
            currentRightPanel.style.opacity = '';
            currentRightPanel.style.transform = '';
            if (nextRightPanel) nextRightPanel.classList.add('active');
          }, 500);
        }
      } else {
        var currentPanel = document.querySelector('.content-panel.active');
        var nextPanel = document.getElementById(goTo);
        switchRightPanel(targetPanelNumber);
        if (currentPanel) {
          currentPanel.style.opacity = '0';
          currentPanel.style.transform = 'translateY(-20px)';
          setTimeout(function() {
            currentPanel.classList.remove('active');
            currentPanel.style.opacity = '';
            currentPanel.style.transform = '';
            if (nextPanel) nextPanel.classList.add('active');
          }, 500);
        } else if (nextPanel) {
          nextPanel.classList.add('active');
        }
      }
      
      window.updateProgress(targetPanelNumber, 'back');
      loseLeads(panelLeads[targetPanelNumber] || 0);
      window.showRobotMessage(goTo);
      currentPanelNumber = targetPanelNumber;
    });
  });
  
// AUTO-START (no splash screen)
var splash = document.getElementById('splash-screen');
if (splash) splash.style.display = 'none';

initAudio();
setTimeout(function() { window.showRobotMessage('panel-1'); }, 500);
  
  window.addEventListener('keydown', function(e) {
  // NEW: Stop here if the screen is tablet size or smaller (<= 991px)
  // This allows the keys to work normally on smaller screens.
  if (window.innerWidth <= 991) return;

  var tagName = document.activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return;

  // KeyCodes: 32=Space, 33=PgUp, 34=PgDn, 35=End, 36=Home, 37=Left, 38=Up, 39=Right, 40=Down
  if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
    e.preventDefault();
  }
});
  
 // Hide progress bar on start
var progressWrapper = document.querySelector('.progress-wrapper');
if (progressWrapper) progressWrapper.classList.remove('visible');

// Start at 0/9 - Memberstack auth will update for logged-in returning users
var progressFill = document.querySelector('.progress-fill');
  
  // Start at 0/9 - Memberstack auth will update for logged-in returning users
var progressFill = document.querySelector('.progress-fill');
if (progressFill) progressFill.style.width = '0%';
var progressNumber = document.querySelector('.progress-number');
if (progressNumber) progressNumber.textContent = '0/9';
var leadNumber = document.getElementById('lead-number');
if (leadNumber) leadNumber.textContent = '$0';
  
  
// INDUSTRY SELECTION - CLEAN VERSION
  
(function() {
  window.selectedIndustrySlug = null;
  
  function syncIndustrySelection() {
    var cards = document.querySelectorAll('.industry-card');
    
    cards.forEach(function(card) {
      var cardSlug = card.getAttribute('data-slug');
      var shouldBeSelected = window.selectedIndustrySlug && cardSlug === window.selectedIndustrySlug;
      
      if (shouldBeSelected) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }
  
  document.addEventListener('click', function(e) {
    var card = e.target.closest('.industry-card');
    if (!card) return;
    
    window.selectedIndustrySlug = card.getAttribute('data-slug');
    syncIndustrySelection();
    
    window.siteConfig.industry = {
      slug: card.getAttribute('data-slug'),
      headline: card.getAttribute('data-headline'),
      description: card.getAttribute('data-description'),
      cta: card.getAttribute('data-cta'),
      image: card.getAttribute('data-image'),
      template5k: card.getAttribute('data-template-5k'),
      template10k: card.getAttribute('data-template-10k'),
      template50k: card.getAttribute('data-template-50k')
    };
    
    updateIndustryPreview();
    var nextBtn = document.querySelector('#right-panel-4 .next-btn');
    if (nextBtn) nextBtn.setAttribute('data-disabled', 'false');
    if (typeof playBuildSound === 'function') playBuildSound();
    
   // AUTO-SWITCH TO NEW SITE TAB - SIMPLE
setTimeout(function() {
  var newSiteTab = document.getElementById('tabs-new-site');
  if (newSiteTab) newSiteTab.click();
}, 400);
    
  });
  
  document.addEventListener('input', function(e) {
    if (e.target.matches('[data-jet-filter] input, .jetboost-search input, input[type="search"]')) {
      setTimeout(syncIndustrySelection, 100);
    }
  });
  
  var container = document.querySelector('.industry-grid') || 
                  document.querySelector('[data-jet-filter-list]') || 
                  document.querySelector('.industry-cards-wrapper');
  
  if (container) {
    new MutationObserver(function(mutations) {
      syncIndustrySelection();
    }).observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
})();
  
  // STYLE SELECTION
  document.querySelectorAll('.style-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.style-card').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
      window.siteConfig.style = {
        slug: this.getAttribute('data-slug'),
        fontClass: this.getAttribute('data-font-class'),
        radius: this.getAttribute('data-radius'),
        buttonRadius: this.getAttribute('data-button-radius'),
        shadow: this.getAttribute('data-shadow')
      };
      updateStylePreview();
      var nextBtn = document.querySelector('#right-panel-5 .next-btn');
      if (nextBtn) nextBtn.setAttribute('data-disabled', 'false');
      playBuildSound();
    });
  });
  
  // COLOR SELECTION
  document.querySelectorAll('.color-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.color-card').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
      window.siteConfig.colors = {
        slug: this.getAttribute('data-slug'),
        primary: this.getAttribute('data-primary'),
        secondary: this.getAttribute('data-secondary'),
        accent: this.getAttribute('data-accent')
      };
      updateColorPreview();
      var nextBtn = document.querySelector('#right-panel-6 .next-btn');
      if (nextBtn) nextBtn.setAttribute('data-disabled', 'false');
      playBuildSound();
    });
  });
  
// PANEL NAVIGATION
  document.querySelectorAll('[data-go-to]').forEach(function(button) {
    button.addEventListener('click', function() {
      if (this.classList.contains('back-btn')) return;
      if (this.classList.contains('next-btn') && this.getAttribute('data-disabled') === 'true') return;
      
      var targetPanelId = this.getAttribute('data-go-to');
      var targetPanelNumber = parseInt(targetPanelId.replace('panel-', ''));
      var rightOnly = this.getAttribute('data-right-only') === 'true';
      var direction = targetPanelNumber > currentPanelNumber ? 'forward' : 'back';
      
      window.updateProgress(targetPanelNumber, direction);
      window.showRobotMessage(targetPanelId);
      
      if (rightOnly) {
        var currentRightPanel = document.querySelector('.right-panel.active');
        var nextRightPanel = document.getElementById('right-' + targetPanelId);
        if (currentRightPanel) {
          currentRightPanel.style.opacity = '0';
          currentRightPanel.style.transform = 'translateY(20px)';
          setTimeout(function() {
            currentRightPanel.classList.remove('active');
            currentRightPanel.style.opacity = '';
            currentRightPanel.style.transform = '';
            if (nextRightPanel) nextRightPanel.classList.add('active');
          }, 500);
        } else if (nextRightPanel) {
          nextRightPanel.classList.add('active');
        }
        if (targetPanelNumber === 7) {
          setTimeout(function() {
            loadOldSiteScreenshot();
            window.sendToZapier();
          }, 600);
        }
      } else {
        var currentPanel = document.querySelector('.content-panel.active');
        var nextPanel = document.getElementById(targetPanelId);
        switchRightPanel(targetPanelNumber);
        if (currentPanel) {
          currentPanel.style.opacity = '0';
          currentPanel.style.transform = 'translateY(-20px)';
          setTimeout(function() {
            currentPanel.classList.remove('active');
            currentPanel.style.opacity = '';
            currentPanel.style.transform = '';
            nextPanel.classList.add('active');
          }, 500);
        } else {
          nextPanel.classList.add('active');
        }
      }
      
      currentPanelNumber = targetPanelNumber;
      playBuildSound();
    });
  });

  // =========================
// DOMAIN & LOGO UPSELLS
// =========================

window.userSkippedUrl = false;
window.originalUrlText = null;

function initUpsellClicks() {

  return;
  // ----- DOMAIN UPSELL (all slides) -----
  var allUrls = document.querySelectorAll('.new-site-url');
  
  allUrls.forEach(function(urlEl) {
    // Store original text once
    if (!window.originalUrlText) {
      window.originalUrlText = urlEl.textContent;
    }
    
    urlEl.addEventListener('click', function() {
      if (urlEl.classList.contains('upsell-disabled')) return;
      
      var domainUpsell = document.getElementById('upsell-domain');
      var isAdding = !urlEl.classList.contains('added');
      
      // Toggle cart upsell
      if (isAdding) {
        if (domainUpsell && !domainUpsell.classList.contains('active')) domainUpsell.click();
      } else {
        if (domainUpsell && domainUpsell.classList.contains('active')) domainUpsell.click();
      }
      
      // Update ALL url elements across all slides
      allUrls.forEach(function(u) {
        if (isAdding) {
          u.classList.add('added');
          u.textContent = '✓ Domain Service Added';
        } else {
          u.classList.remove('added');
          u.textContent = window.originalUrlText;
        }
      });
      
      if (typeof playBuildSound === 'function') playBuildSound();
    });
  });
  
  // ----- LOGO UPSELL (all slides) -----
  var allLogos = document.querySelectorAll('.logo-upsell-anchor');
  
  allLogos.forEach(function(logoEl) {
    logoEl.addEventListener('click', function() {
      var brandUpsell = document.getElementById('upsell-brand');
      var isAdding = !logoEl.classList.contains('added');
      
      // Toggle cart upsell
      if (isAdding) {
        if (brandUpsell && !brandUpsell.classList.contains('active')) brandUpsell.click();
      } else {
        if (brandUpsell && brandUpsell.classList.contains('active')) brandUpsell.click();
      }
      
      // Update ALL logo elements across all slides
      allLogos.forEach(function(l) {
        if (isAdding) {
          l.classList.add('added');
        } else {
          l.classList.remove('added');
        }
      });
      
      if (typeof playBuildSound === 'function') playBuildSound();
    });
  });
}

// =========================
// SYNC CART ↔ BUTTONS
// =========================

function syncUpsellStates() {
  var domainUpsell = document.getElementById('upsell-domain');
  var brandUpsell = document.getElementById('upsell-brand');
  var allUrls = document.querySelectorAll('.new-site-url');
  var allLogos = document.querySelectorAll('.logo-upsell-anchor');
  
  // Store original URL if not already stored
  if (!window.originalUrlText && allUrls.length > 0) {
    window.originalUrlText = allUrls[0].textContent;
  }
  
  // Sync domain across all slides
  allUrls.forEach(function(urlEl) {
    if (urlEl.classList.contains('upsell-disabled')) return;
    
    if (domainUpsell && domainUpsell.classList.contains('active') && !urlEl.classList.contains('added')) {
      urlEl.classList.add('added');
      urlEl.textContent = '✓ Domain Service Added';
    } else if (domainUpsell && !domainUpsell.classList.contains('active') && urlEl.classList.contains('added')) {
      urlEl.classList.remove('added');
      urlEl.textContent = window.originalUrlText || 'https://www.yoursite.com';
    }
  });
  
  // Sync logo across all slides
  allLogos.forEach(function(logoEl) {
    if (brandUpsell && brandUpsell.classList.contains('active') && !logoEl.classList.contains('added')) {
      logoEl.classList.add('added');
    } else if (brandUpsell && !brandUpsell.classList.contains('active') && logoEl.classList.contains('added')) {
      logoEl.classList.remove('added');
    }
  });
}

// =========================
// CONDITIONAL DOMAIN
// =========================

// =========================
// CONDITIONAL DOMAIN - EVENT DRIVEN
// =========================
function initConditionalDomainUpsell() {
  var allUrls = document.querySelectorAll('.new-site-url');
  if (allUrls.length === 0) return;
  
  function check() {
    allUrls.forEach(function(urlEl) {
      if (window.userSkippedUrl || window.hasNoSite) {
        urlEl.classList.remove('upsell-disabled');
      } else {
        urlEl.classList.add('upsell-disabled');
      }
    });
  }
  
  check(); // Run once on init
  // REMOVED: setInterval(check, 300);
}

// Expose check function so you can call it when needed
window.updateDomainUpsell = function() {
  var allUrls = document.querySelectorAll('.new-site-url');
  allUrls.forEach(function(urlEl) {
    if (window.userSkippedUrl || window.hasNoSite) {
      urlEl.classList.remove('upsell-disabled');
    } else {
      urlEl.classList.add('upsell-disabled');
    }
  });
};

initUpsellClicks();
initConditionalDomainUpsell();
// REMOVED: setInterval(syncUpsellStates, 300);
});
