document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. NAV SCRIPTER: HEADER SCROLL & MOBILE TOGGLE
       ========================================================================== */
     const header = document.querySelector('.header');
     const mobileToggle = document.querySelector('.mobile-nav-toggle');
     const mobileMenu = document.querySelector('.mobile-menu');
     const mobileLinks = document.querySelectorAll('.mobile-nav-link');
 
     // Header class scroll toggle
     window.addEventListener('scroll', () => {
         if (window.scrollY > 50) {
             header.classList.add('scrolled');
         } else {
             header.classList.remove('scrolled');
         }
     });
 
     // Mobile nav toggle
     mobileToggle.addEventListener('click', () => {
         mobileToggle.classList.toggle('open');
         mobileMenu.classList.toggle('open');
         document.body.classList.toggle('no-scroll');
     });
 
     // Close mobile nav on link click
     mobileLinks.forEach(link => {
         link.addEventListener('click', () => {
             mobileToggle.classList.remove('open');
             mobileMenu.classList.remove('open');
             document.body.classList.remove('no-scroll');
         });
     });
 
     /* ==========================================================================
        2. FAQ ACCORDION LOGIC (Fallback for static rendering)
        ========================================================================== */
     const faqItems = document.querySelectorAll('.faq-item');
     faqItems.forEach(item => {
         const trigger = item.querySelector('.faq-trigger');
         trigger.addEventListener('click', () => {
             const isOpen = item.classList.contains('open');
             faqItems.forEach(otherItem => otherItem.classList.remove('open'));
             if (!isOpen) item.classList.add('open');
         });
     });
 
     /* ==========================================================================
        3. MAP INTERACTIVE ADDRESS PICKER (Leaflet & OpenStreetMap)
        ========================================================================== */
     let deliveryMap = null;
     let deliveryMarker = null;
     let deliveryCoords = { lat: -12.046374, lng: -77.042793 }; // Lima, Peru default
 
     const addressInput = document.getElementById('client-address');
     const suggestionsBox = document.getElementById('address-suggestions');
 
     // Reverse Geocoding helper: Get Address name from Coordinates
     const reverseGeocode = async (lat, lng) => {
         try {
             const res = await fetch(`/api/reverse?lat=${lat}&lng=${lng}`);
             const data = await res.json();
             
             if (data && addressInput) {
                 let cleanAddress = data.display_name;
                 
                 // If structured address details are present, format them cleanly
                 if (data.address) {
                     const addr = data.address;
                     const road = addr.road || addr.pedestrian || addr.cycleway || addr.suburb || '';
                     const houseNum = addr.house_number || '';
                     const suburb = addr.suburb || addr.neighbourhood || '';
                     const city = addr.city || addr.town || addr.municipality || '';
 
                     if (road) {
                         cleanAddress = `${road} ${houseNum}`.trim();
                         if (suburb && suburb !== road) cleanAddress += `, ${suburb}`;
                         if (city) cleanAddress += `, ${city}`;
                     }
                 }
                 addressInput.value = cleanAddress;
             }
         } catch (err) {
             console.error('Failed to reverse geocode:', err);
         }
     };
 
     // Autocomplete suggestions debounce timer
     let searchDebounceTimer = null;
 
     if (addressInput) {
         addressInput.addEventListener('input', (e) => {
             clearTimeout(searchDebounceTimer);
             const query = e.target.value.trim();
             
             if (query.length < 3) {
                 if (suggestionsBox) suggestionsBox.style.display = 'none';
                 return;
             }
 
             // Debounce API calls by 400ms to save server bandwidth
             searchDebounceTimer = setTimeout(async () => {
                 try {
                     const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
                     const results = await res.json();
                     
                     if (results && results.length > 0 && suggestionsBox) {
                         suggestionsBox.innerHTML = '';
                         suggestionsBox.style.display = 'block';
 
                         results.forEach(item => {
                             const div = document.createElement('div');
                             div.style.padding = '10px 14px';
                             div.style.cursor = 'pointer';
                             div.style.fontSize = '0.85rem';
                             div.style.borderBottom = '1px solid var(--color-border)';
                             div.style.transition = 'background-color 0.2s';
                             div.textContent = item.display_name;
 
                             // Hover styling
                             div.addEventListener('mouseenter', () => {
                                 div.style.backgroundColor = 'var(--color-bg-secondary)';
                             });
                             div.addEventListener('mouseleave', () => {
                                 div.style.backgroundColor = 'transparent';
                             });
 
                             // Select click event
                             div.addEventListener('click', () => {
                                 addressInput.value = item.display_name;
                                 suggestionsBox.style.display = 'none';
                                 
                                 const lat = parseFloat(item.lat);
                                 const lng = parseFloat(item.lon);
                                 deliveryCoords = { lat, lng };
                                 
                                 if (deliveryMap) {
                                     deliveryMap.setView([lat, lng], 16);
                                     deliveryMarker.setLatLng([lat, lng]);
                                 }
                             });
 
                             suggestionsBox.appendChild(div);
                         });
                     } else {
                         if (suggestionsBox) suggestionsBox.style.display = 'none';
                     }
                 } catch (err) {
                     console.error('Autocomplete search error:', err);
                 }
             }, 400);
         });
 
         // Hide suggestions on document click
         document.addEventListener('click', (e) => {
             if (suggestionsBox && !addressInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                 suggestionsBox.style.display = 'none';
             }
         });
     }
 
     const initMap = () => {
         const mapDiv = document.getElementById('delivery-map');
         if (!mapDiv) return;
 
         // Initialize Map
         deliveryMap = L.map('delivery-map').setView([deliveryCoords.lat, deliveryCoords.lng], 13);
 
         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '© OpenStreetMap contributors'
         }).addTo(deliveryMap);
 
         // Initial draggable Marker
         deliveryMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], {
             draggable: true
         }).addTo(deliveryMap);
 
         // Reverse geocode and update address input when user drags pin
         deliveryMarker.on('dragend', async () => {
             const pos = deliveryMarker.getLatLng();
             deliveryCoords = { lat: pos.lat, lng: pos.lng };
             await reverseGeocode(pos.lat, pos.lng);
         });
 
         // Reverse geocode and move marker when user clicks on map
         deliveryMap.on('click', async (e) => {
             const pos = e.latlng;
             deliveryCoords = { lat: pos.lat, lng: pos.lng };
             deliveryMarker.setLatLng(pos);
             await reverseGeocode(pos.lat, pos.lng);
         });
     };
 
     // GPS Location Finder Button
     const gpsBtn = document.getElementById('btn-gps-location');
     if (gpsBtn) {
         gpsBtn.addEventListener('click', () => {
             if (navigator.geolocation) {
                 gpsBtn.textContent = 'Obteniendo...';
                 navigator.geolocation.getCurrentPosition(async (pos) => {
                     gpsBtn.textContent = '📍 GPS';
                     const lat = pos.coords.latitude;
                     const lng = pos.coords.longitude;
                     deliveryCoords = { lat, lng };
                     if (deliveryMap) {
                         deliveryMap.setView([lat, lng], 16);
                         deliveryMarker.setLatLng([lat, lng]);
                     }
                     await reverseGeocode(lat, lng);
                 }, (err) => {
                     gpsBtn.textContent = '📍 GPS';
                     alert('No pudimos acceder a tu GPS. Por favor ubica tu dirección manualmente en el mapa.');
                 }, { enableHighAccuracy: true });
             } else {
                 alert('Tu navegador no soporta geolocalización.');
             }
         });
     }
 
     // Date picker setting (Min 3 days in future)
     const dateInput = document.getElementById('client-event-date');
     if (dateInput) {
         const today = new Date();
         today.setDate(today.getDate() + 3);
         const yyyy = today.getFullYear();
         const mm = String(today.getMonth() + 1).padStart(2, '0');
         const dd = String(today.getDate()).padStart(2, '0');
         dateInput.min = `${yyyy}-${mm}-${dd}`;
         dateInput.value = `${yyyy}-${mm}-${dd}`;
     }
 
     // Initialize the map on load
     initMap();
 
     /* ==========================================================================
        4. INTERACTIVE VALUE CALCULATOR STATE & REGULAR SETUP
        ========================================================================== */
     const hoursDisplay = document.getElementById('calc-hours-display');
     const ingredientsDisplay = document.getElementById('calc-ingredients-display');
     const priceDisplay = document.getElementById('calc-price-display');
     const whatsappSubmit = document.getElementById('whatsapp-submit');
 
     // Step Wizard Elements
     const step1 = document.getElementById('calc-step-1');
     const step2 = document.getElementById('calc-step-2');
     const btnNextStep = document.getElementById('btn-next-step');
     const btnPrevStep = document.getElementById('btn-prev-step');
 
     const clientNameInput = document.getElementById('client-name');
     const clientEmailInput = document.getElementById('client-email');
     const clientWhatsappInput = document.getElementById('client-whatsapp');
 
     // Default State Variables (Fallback)
     let contactPhone = "51936037502";
     let selectedSize = { value: "10", hours: 3.0, price: 90, text: "10 personas" };
     let selectedBiscuit = { value: "vainilla", factor: 1.0, text: "Vainilla Clásica" };
     let selectedFlavor = { value: "frutal", factor: 1.0, desc: "Mantequilla 82%, limón natural.", text: "Cítrico y Frutal" };
     let selectedDesign = { value: "minimal", hoursAdd: 0, priceAdd: 0, desc: "Texturizado sutil.", text: "Minimalista Texturada" };
     let uploadedDesignImages = [];
 
     // Formatter for Peruvian Sol (PEN)
     const formatCurrency = (amount) => {
         return new Intl.NumberFormat('es-PE', {
             style: 'currency',
             currency: 'PEN',
             minimumFractionDigits: 0
         }).format(amount);
     };
 
     // Calculate and Update UI Function
     const updateCalculator = () => {
         const totalHours = selectedSize.hours + selectedDesign.hoursAdd;
         
         // Base Price * Biscuit Factor * Flavor Factor + Design Price Addition
         const baseCalculatedPrice = Math.round(
             (selectedSize.price * selectedBiscuit.factor * selectedFlavor.factor) + selectedDesign.priceAdd
         );
         
         const priceMin = baseCalculatedPrice;
         const priceMax = baseCalculatedPrice + Math.round(selectedSize.price * 0.08); // 8% range variation
         
         // Update values in HTML
         hoursDisplay.innerHTML = `<strong>${totalHours} Horas</strong> de batido, horneado, ensamblado manual y decoración a mano.`;
         ingredientsDisplay.innerHTML = `<strong>Bizcocho:</strong> ${selectedBiscuit.text}. <strong>Relleno:</strong> ${selectedFlavor.text}.`;
         
         if (selectedDesign.value === 'custom') {
             priceDisplay.innerHTML = `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)} <br><span style="font-size: 0.75rem; color: var(--color-accent-primary); font-weight: 500;">(Sujeto a variación por diseño personalizado)</span>`;
         } else {
             priceDisplay.textContent = `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`;
         }
     };
 
     // Button selection handler utility
     const setupOptionGroup = (buttons, updateCallback) => {
         buttons.forEach(btn => {
             btn.addEventListener('click', (e) => {
                 // Remove active class from siblings
                 buttons.forEach(sibling => sibling.classList.remove('active'));
                 
                 // Add active class to clicked button
                 btn.classList.add('active');
                 
                 // Trigger state update
                 updateCallback(btn);
             });
         });
     };
 
     // Wizard step transition listeners
     btnNextStep.addEventListener('click', () => {
         const name = clientNameInput.value.trim();
         const email = clientEmailInput.value.trim();
         const whatsapp = clientWhatsappInput.value.trim();
         const dateVal = dateInput ? dateInput.value : '';
         const addressVal = addressInput ? addressInput.value.trim() : '';
 
         if (!name) {
             alert('Por favor, ingresa tu Nombre y Apellido.');
             clientNameInput.focus();
             return;
         }
 
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!email || !emailRegex.test(email)) {
             alert('Por favor, ingresa un correo electrónico válido.');
             clientEmailInput.focus();
             return;
         }
 
         if (!whatsapp || whatsapp.length < 9) {
             alert('Por favor, ingresa un número de WhatsApp válido (mínimo 9 dígitos).');
             clientWhatsappInput.focus();
             return;
         }
 
         if (!dateVal) {
             alert('Por favor, selecciona la fecha del evento.');
             if (dateInput) dateInput.focus();
             return;
         }
 
         if (!addressVal) {
             alert('Por favor, ingresa tu dirección de entrega.');
             if (addressInput) addressInput.focus();
             return;
         }
 
         // Unlock step 2
         step1.classList.add('hidden');
         step2.classList.remove('hidden');
 
         // Scroll to top of calculator smoothly
         document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
     });
 
     btnPrevStep.addEventListener('click', () => {
         step2.classList.add('hidden');
         step1.classList.remove('hidden');
 
         document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
     });
 
     // WhatsApp Form Submission
     whatsappSubmit.addEventListener('click', () => {
         const totalHours = selectedSize.hours + selectedDesign.hoursAdd;
         const baseCalculatedPrice = Math.round(
             (selectedSize.price * selectedBiscuit.factor * selectedFlavor.factor) + selectedDesign.priceAdd
         );
         const priceMin = baseCalculatedPrice;
         const priceMax = baseCalculatedPrice + Math.round(selectedSize.price * 0.08);
         
         const name = clientNameInput.value.trim();
         const email = clientEmailInput.value.trim();
         const whatsapp = clientWhatsappInput.value.trim();
         const dateVal = dateInput ? dateInput.value : '';
         const addressVal = addressInput ? addressInput.value.trim() : '';
         const mapsLink = `https://www.google.com/maps?q=${deliveryCoords.lat},${deliveryCoords.lng}`;
 
         let formattedDate = dateVal;
         if (dateVal.includes('-')) {
             const parts = dateVal.split('-');
             formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
         }
 
         let designPart = `• *Estilo de diseño:* ${selectedDesign.text}`;
         if (selectedDesign.value === 'custom') {
             const customDesc = document.getElementById('calc-custom-desc').value.trim();
             designPart = `• *Estilo de diseño:* Personalizado
 • *Detalles del diseño:* ${customDesc || 'Sin descripción adicional.'}`;
             
             if (uploadedDesignImages.length > 0) {
                 designPart += `\n • *Fotos de referencia:*`;
                 uploadedDesignImages.forEach((url, i) => {
                     designPart += `\n   - Foto ${i + 1}: ${url}`;
                 });
             }
         }
 
         // Build clear, informative WhatsApp copywriting
         const messageText = `¡Hola Plenilune Pastelería! \u{1F319} Vengo desde su página web y me gustaría cotizar una torta artesanal personalizada:
 
 \u{1F464} *Datos de Contacto y Entrega:*
 • *Cliente:* ${name}
 • *Email:* ${email}
 • *WhatsApp:* ${whatsapp}
 • *Fecha de Entrega:* ${formattedDate}
 • *Dirección de Entrega:* ${addressVal}
 • *Ubicación GPS (Google Maps):* ${mapsLink}
 
 \u{2728} *Detalles seleccionados:*
 • *Porciones:* ${selectedSize.text}
 • *Bizcocho:* ${selectedBiscuit.text}
 • *Relleno:* ${selectedFlavor.text}
 ${designPart}
  
 \u{23F1}\u{FE0F} *Dedicación estimada:* ${totalHours} horas de trabajo artesanal.
 \u{1F4B0} *Inversión aproximada:* ${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}${selectedDesign.value === 'custom' ? ' (Sujeto a variación por diseño)' : ''}
  
 ¿Tienen disponibilidad en su taller para la fecha de mi evento? Me gustaría coordinar más detalles del diseño y la entrega. ¡Muchas gracias!`;
 
         const encodedMessage = encodeURIComponent(messageText);
         const whatsappUrl = `https://api.whatsapp.com/send?phone=${contactPhone}&text=${encodedMessage}`;
         
         // Open WhatsApp in new tab
         window.open(whatsappUrl, '_blank');
     });
 
     /* ==========================================================================
        5. CAROUSEL ENGINE LOGIC
        ========================================================================== */
     let currentSlide = 0;
 
     const setupCarousel = (totalSlides) => {
         const track = document.getElementById('gallery-track');
         const prevBtn = document.getElementById('gallery-prev');
         const nextBtn = document.getElementById('gallery-next');
         const indicatorsContainer = document.getElementById('gallery-indicators');
 
         const updateSlide = () => {
             track.style.transform = `translateX(-${currentSlide * 100}%)`;
             const indicators = indicatorsContainer.querySelectorAll('.indicator');
             indicators.forEach((ind, i) => {
                 ind.classList.toggle('active', i === currentSlide);
             });
         };
 
         prevBtn.addEventListener('click', () => {
             currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
             updateSlide();
         });
 
         nextBtn.addEventListener('click', () => {
             currentSlide = (currentSlide + 1) % totalSlides;
             updateSlide();
         });
 
         const indicators = indicatorsContainer.querySelectorAll('.indicator');
         indicators.forEach(ind => {
             ind.addEventListener('click', () => {
                 currentSlide = parseInt(ind.getAttribute('data-slide'));
                 updateSlide();
             });
         });
     };
 
     /* ==========================================================================
        6. FETCH CONFIG & HYDRATION
        ========================================================================== */
     const loadSettings = async () => {
         try {
             const res = await fetch('/api/config');
             const config = await res.json();
 
             // Hydrate general info
             document.getElementById('hero-title-display').textContent = config.general.heroTitle;
             document.getElementById('hero-subtitle-display').textContent = config.general.heroSubtitle;
             
             document.getElementById('footer-phone').textContent = `+${config.general.phone.substring(0,2)} ${config.general.phone.substring(2,5)} ${config.general.phone.substring(5,8)} ${config.general.phone.substring(8)}`;
             document.getElementById('footer-email').textContent = config.general.email;
             document.getElementById('footer-location').textContent = config.general.location;
 
             // Update contact phone
             contactPhone = config.general.phone;
 
             // Update floating WhatsApp button
             const floatLink = document.getElementById('whatsapp-float-link');
             if (floatLink) {
                 floatLink.setAttribute('href', `https://api.whatsapp.com/send?phone=${contactPhone}&text=${encodeURIComponent("¡Hola Plenilune Pastelería! \u{1F319} Me gustaría hacer una consulta sobre sus tortas de autor.")}`);
             }
 
             // Hydrate Dynamic Landing Page Sections Content (CMS)
             if (config.landing) {
                 const land = config.landing;
 
                 // Hero
                 if (land.hero) {
                     const tag = document.getElementById('hero-tag-display');
                     const slogan = document.getElementById('hero-slogan-display');
                     const title = document.getElementById('hero-title-display');
                     const subtitle = document.getElementById('hero-subtitle-display');
                     
                     if (tag) tag.textContent = land.hero.tag;
                     if (slogan) slogan.textContent = land.hero.slogan;
                     if (title) title.textContent = land.hero.title;
                     if (subtitle) subtitle.textContent = land.hero.subtitle;
                 }
 
                 // Comparison
                 if (land.comparison) {
                     const tag = document.getElementById('comparison-tag-display');
                     const title = document.getElementById('comparison-title-display');
                     const desc = document.getElementById('comparison-desc-display');
                     const indTitle = document.getElementById('comparison-ind-title-display');
                     const plenTitle = document.getElementById('comparison-plen-title-display');
                     
                     if (tag) tag.textContent = land.comparison.tag;
                     if (title) title.textContent = land.comparison.title;
                     if (desc) desc.textContent = land.comparison.desc;
                     if (indTitle) indTitle.textContent = land.comparison.industrialTitle;
                     if (plenTitle) plenTitle.textContent = land.comparison.pleniluneTitle;
 
                     // Bullets Industrial
                     const indBulletsContainer = document.getElementById('comparison-ind-bullets-display');
                     if (indBulletsContainer && land.comparison.industrialBullets) {
                         indBulletsContainer.innerHTML = '';
                         land.comparison.industrialBullets.forEach(bullet => {
                             const li = document.createElement('li');
                             li.innerHTML = `
                                 <svg class="icon icon-cross" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                 <div>${bullet}</div>
                             `;
                             indBulletsContainer.appendChild(li);
                         });
                     }
 
                     // Bullets Plenilune
                     const plenBulletsContainer = document.getElementById('comparison-plen-bullets-display');
                     if (plenBulletsContainer && land.comparison.pleniluneBullets) {
                         plenBulletsContainer.innerHTML = '';
                         land.comparison.pleniluneBullets.forEach(bullet => {
                             const li = document.createElement('li');
                             li.innerHTML = `
                                 <svg class="icon icon-check" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                 <div>${bullet}</div>
                             `;
                             plenBulletsContainer.appendChild(li);
                         });
                     }
                 }
 
                 // Process
                 if (land.process) {
                     const tag = document.getElementById('process-tag-display');
                     const title = document.getElementById('process-title-display');
                     const desc = document.getElementById('process-desc-display');
                     const quote = document.getElementById('process-quote-display');
                     const author = document.getElementById('process-quote-author-display');
                     
                     if (tag) tag.textContent = land.process.tag;
                     if (title) title.textContent = land.process.title;
                     if (desc) desc.textContent = land.process.desc;
                     if (quote) quote.textContent = land.process.quote;
                     if (author) author.textContent = `— ${land.process.quoteAuthor}`;
 
                     // Dynamic Steps Timeline
                     const stepsContainer = document.getElementById('process-steps-display');
                     if (stepsContainer && land.process.steps) {
                         stepsContainer.innerHTML = '';
                         land.process.steps.forEach((step, idx) => {
                             const numStr = String(idx + 1).padStart(2, '0');
                             const stepDiv = document.createElement('div');
                             stepDiv.className = 'process-step';
                             stepDiv.innerHTML = `
                                 <div class="process-number">${numStr}</div>
                                 <div class="process-content">
                                     <h3>${step.title}</h3>
                                     <p>${step.desc}</p>
                                 </div>
                             `;
                             stepsContainer.appendChild(stepDiv);
                         });
                     }
                 }
 
                 // Gallery
                 if (land.gallery) {
                     const tag = document.getElementById('gallery-tag-display');
                     const title = document.getElementById('gallery-title-display');
                     const desc = document.getElementById('gallery-desc-display');
                     
                     if (tag) tag.textContent = land.gallery.tag;
                     if (title) title.textContent = land.gallery.title;
                     if (desc) desc.textContent = land.gallery.desc;
                 }
 
                 // Calculator Header
                 if (land.calculator) {
                     const tag = document.getElementById('calc-tag-display');
                     const title = document.getElementById('calc-title-display');
                     const desc = document.getElementById('calc-desc-display');
                     
                     if (tag) tag.textContent = land.calculator.tag;
                     if (title) title.textContent = land.calculator.title;
                     if (desc) desc.innerHTML = land.calculator.desc;
                 }
 
                 // FAQs Accordion
                 if (land.faqs) {
                     const tag = document.getElementById('faq-tag-display');
                     const title = document.getElementById('faq-title-display');
                     const desc = document.getElementById('faq-desc-display');
                     
                     if (tag) tag.textContent = land.faqTag || "Transparencia Total";
                     if (title) title.textContent = land.faqTitle || "Preguntas Frecuentes";
                     if (desc) desc.textContent = land.faqDesc || "Resolvemos tus dudas sobre nuestros precios, reservas y método de trabajo.";
 
                     const faqContainer = document.getElementById('faq-accordion-display');
                     if (faqContainer) {
                         faqContainer.innerHTML = '';
                         land.faqs.forEach(faq => {
                             const item = document.createElement('div');
                             item.className = 'faq-item';
                             item.innerHTML = `
                                 <button class="faq-trigger">
                                     <span>${faq.question}</span>
                                     <svg class="icon icon-chevron" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                                 </button>
                                 <div class="faq-content">
                                     <p>${faq.answer}</p>
                                 </div>
                             `;
                             faqContainer.appendChild(item);
                         });
 
                         // Re-bind Accordion click listeners
                         const newFaqItems = faqContainer.querySelectorAll('.faq-item');
                         newFaqItems.forEach(item => {
                             const trigger = item.querySelector('.faq-trigger');
                             trigger.addEventListener('click', () => {
                                 const isOpen = item.classList.contains('open');
                                 newFaqItems.forEach(otherItem => otherItem.classList.remove('open'));
                                 if (!isOpen) item.classList.add('open');
                             });
                         });
                     }
                 }
             }
 
             // Hydrate Catalog Items
             if (config.catalog) {
                 config.catalog.forEach(item => {
                     const titleEl = document.querySelector(`[data-catalog-title="${item.id}"]`);
                     const tagEl = document.querySelector(`[data-catalog-tag="${item.id}"]`);
                     const descEl = document.querySelector(`[data-catalog-desc="${item.id}"]`);
                     if (titleEl) titleEl.textContent = item.title;
                     if (tagEl) tagEl.textContent = item.tag;
                     if (descEl) descEl.textContent = item.desc;
                 });
             }
 
             // Hydrate 4x2 Grid Carousel Gallery
             if (config.gallery && config.gallery.length > 0) {
                 const track = document.getElementById('gallery-track');
                 const indicatorsContainer = document.getElementById('gallery-indicators');
                 
                 track.innerHTML = '';
                 indicatorsContainer.innerHTML = '';
                 
                 const imagesPerSlide = 8;
                 const totalSlides = Math.ceil(config.gallery.length / imagesPerSlide);
                 
                 for (let i = 0; i < totalSlides; i++) {
                     const slide = document.createElement('div');
                     slide.className = 'gallery-slide';
                     
                     const grid = document.createElement('div');
                     grid.className = 'gallery-grid-4x2';
                     
                     const startIndex = i * imagesPerSlide;
                     const endIndex = Math.min(startIndex + imagesPerSlide, config.gallery.length);
                     
                     for (let j = startIndex; j < endIndex; j++) {
                         const imgWrapper = document.createElement('div');
                         imgWrapper.className = 'gallery-img-wrapper';
                         
                         const img = document.createElement('img');
                         img.src = config.gallery[j];
                         img.alt = 'Creación Plenilune';
                         img.className = 'gallery-img';
                         img.loading = 'lazy';
                         
                         imgWrapper.appendChild(img);
                         grid.appendChild(imgWrapper);
                     }
                     
                     slide.appendChild(grid);
                     track.appendChild(slide);
                     
                     const indicator = document.createElement('span');
                     indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
                     indicator.setAttribute('data-slide', i);
                     indicatorsContainer.appendChild(indicator);
                 }
                 
                 setupCarousel(totalSlides);
             }
 
             // Hydrate dynamic sizes
             const sizeContainer = document.getElementById('size-options');
             if (sizeContainer && config.calculator.sizes) {
                 sizeContainer.innerHTML = '';
                 Object.keys(config.calculator.sizes).forEach((key, idx) => {
                     const size = config.calculator.sizes[key];
                     const btn = document.createElement('button');
                     btn.type = 'button';
                     btn.className = `option-btn ${key === "10" ? 'active' : ''}`; // Default to 10 personas
                     btn.setAttribute('data-value', key);
                     btn.setAttribute('data-hours', size.hours);
                     btn.setAttribute('data-price', size.price);
                     btn.innerHTML = `
                         <strong>${key === '40' ? '40 personas' : key + ' personas'}</strong>
                         <span>${size.desc.includes('–') ? size.desc.split('–')[1].trim() : size.desc}</span>
                     `;
                     sizeContainer.appendChild(btn);
                 });
             }
 
             // Hydrate biscuit flavors
             const biscuitContainer = document.getElementById('biscuit-options');
             if (biscuitContainer && config.calculator.biscuits) {
                 biscuitContainer.innerHTML = '';
                 Object.keys(config.calculator.biscuits).forEach((key, idx) => {
                     const bisc = config.calculator.biscuits[key];
                     const btn = document.createElement('button');
                     btn.type = 'button';
                     btn.className = `option-btn ${idx === 0 ? 'active' : ''}`;
                     btn.setAttribute('data-value', key);
                     btn.setAttribute('data-factor', bisc.factor);
                     btn.innerHTML = `
                         <strong>${bisc.title}</strong>
                         <span>${bisc.desc}</span>
                     `;
                     biscuitContainer.appendChild(btn);
                 });
             }
 
             // Hydrate filling flavors
             const flavorContainer = document.getElementById('flavor-options');
             if (flavorContainer && config.calculator.fillings) {
                 flavorContainer.innerHTML = '';
                 Object.keys(config.calculator.fillings).forEach((key, idx) => {
                     const fill = config.calculator.fillings[key];
                     const btn = document.createElement('button');
                     btn.type = 'button';
                     btn.className = `option-btn ${idx === 0 ? 'active' : ''}`;
                     btn.setAttribute('data-value', key);
                     btn.setAttribute('data-factor', fill.factor);
                     btn.setAttribute('data-desc', fill.desc);
                     btn.innerHTML = `
                         <strong>${fill.title}</strong>
                         <span>${fill.desc}</span>
                     `;
                     flavorContainer.appendChild(btn);
                 });
             }
 
             // Hydrate design types
             const designContainer = document.getElementById('design-options');
             if (designContainer && config.calculator.designs) {
                 designContainer.innerHTML = '';
                 Object.keys(config.calculator.designs).forEach((key, idx) => {
                     const des = config.calculator.designs[key];
                     const btn = document.createElement('button');
                     btn.type = 'button';
                     btn.className = `option-btn ${idx === 0 ? 'active' : ''}`;
                     btn.setAttribute('data-value', key);
                     btn.setAttribute('data-hours-add', des.hoursAdd);
                     btn.setAttribute('data-price-add', des.priceAdd);
                     btn.setAttribute('data-desc', des.desc);
                     btn.setAttribute('data-image', des.image || '');
                     btn.innerHTML = `
                         <strong>${des.title}</strong>
                         <span>${des.desc}</span>
                     `;
                     designContainer.appendChild(btn);
                 });
             }
 
             // Grab generated buttons and bind listeners
             const sizeButtons = document.querySelectorAll('#size-options .option-btn');
             const biscuitButtons = document.querySelectorAll('#biscuit-options .option-btn');
             const flavorButtons = document.querySelectorAll('#flavor-options .option-btn');
             const designButtons = document.querySelectorAll('#design-options .option-btn');
 
             setupOptionGroup(sizeButtons, (btn) => {
                 selectedSize = {
                     value: btn.getAttribute('data-value'),
                     hours: parseFloat(btn.getAttribute('data-hours')),
                     price: parseInt(btn.getAttribute('data-price')),
                     text: btn.querySelector('strong').textContent
                 };
                 updateCalculator();
             });
 
             setupOptionGroup(biscuitButtons, (btn) => {
                 selectedBiscuit = {
                     value: btn.getAttribute('data-value'),
                     factor: parseFloat(btn.getAttribute('data-factor')),
                     text: btn.querySelector('strong').textContent
                 };
                 updateCalculator();
             });
 
             setupOptionGroup(flavorButtons, (btn) => {
                 selectedFlavor = {
                     value: btn.getAttribute('data-value'),
                     factor: parseFloat(btn.getAttribute('data-factor')),
                     desc: btn.getAttribute('data-desc'),
                     text: btn.querySelector('strong').textContent
                 };
                 updateCalculator();
             });
 
             setupOptionGroup(designButtons, (btn) => {
                 selectedDesign = {
                     value: btn.getAttribute('data-value'),
                     hoursAdd: parseFloat(btn.getAttribute('data-hours-add')),
                     priceAdd: parseInt(btn.getAttribute('data-price-add')),
                     desc: btn.getAttribute('data-desc'),
                     image: btn.getAttribute('data-image'),
                     text: btn.querySelector('strong').textContent
                 };
 
                 const previewContainer = document.getElementById('design-preview-container');
                 const previewImg = document.getElementById('design-preview-img');
                 const customModule = document.getElementById('custom-design-module');
 
                 if (selectedDesign.value === 'custom') {
                     if (previewContainer) previewContainer.style.display = 'none';
                     if (customModule) customModule.style.display = 'block';
                 } else {
                     if (customModule) customModule.style.display = 'none';
                     if (selectedDesign.image) {
                         if (previewImg) previewImg.src = selectedDesign.image;
                         if (previewContainer) previewContainer.style.display = 'block';
                     } else {
                         if (previewContainer) previewContainer.style.display = 'none';
                     }
                 }
                 updateCalculator();
             });
 
             // Re-initialize active variables with loaded values
             const activeSizeBtn = document.querySelector('#size-options .option-btn.active');
             if (activeSizeBtn) {
                 selectedSize = {
                     value: activeSizeBtn.getAttribute('data-value'),
                     hours: parseFloat(activeSizeBtn.getAttribute('data-hours')),
                     price: parseInt(activeSizeBtn.getAttribute('data-price')),
                     text: activeSizeBtn.querySelector('strong').textContent
                 };
             }
 
             const activeBiscuitBtn = document.querySelector('#biscuit-options .option-btn.active');
             if (activeBiscuitBtn) {
                 selectedBiscuit = {
                     value: activeBiscuitBtn.getAttribute('data-value'),
                     factor: parseFloat(activeBiscuitBtn.getAttribute('data-factor')),
                     text: activeBiscuitBtn.querySelector('strong').textContent
                 };
             }
 
             const activeFlavorBtn = document.querySelector('#flavor-options .option-btn.active');
             if (activeFlavorBtn) {
                 selectedFlavor = {
                     value: activeFlavorBtn.getAttribute('data-value'),
                     factor: parseFloat(activeFlavorBtn.getAttribute('data-factor')),
                     desc: activeFlavorBtn.getAttribute('data-desc'),
                     text: activeFlavorBtn.querySelector('strong').textContent
                 };
             }
 
             const activeDesignBtn = document.querySelector('#design-options .option-btn.active');
             if (activeDesignBtn) {
                 selectedDesign = {
                     value: activeDesignBtn.getAttribute('data-value'),
                     hoursAdd: parseFloat(activeDesignBtn.getAttribute('data-hours-add')),
                     priceAdd: parseInt(activeDesignBtn.getAttribute('data-price-add')),
                     desc: activeDesignBtn.getAttribute('data-desc'),
                     image: activeDesignBtn.getAttribute('data-image'),
                     text: activeDesignBtn.querySelector('strong').textContent
                 };
             }
 
             updateCalculator();
 
             // Trigger map resize fix once hydrations are done and container is ready
             setTimeout(() => {
                 if (deliveryMap) deliveryMap.invalidateSize();
             }, 300);
 
         } catch (err) {
             console.warn('Failed to load settings from API, using default fallbacks:', err);
             updateCalculator();
         }
     };
 
     // Custom Design Reference Photos Uploader
     const filesInput = document.getElementById('calc-custom-files');
     const uploadStatus = document.getElementById('calc-upload-status');
     const previewsContainer = document.getElementById('calc-custom-previews');
 
     if (filesInput) {
         filesInput.addEventListener('change', async (e) => {
             const files = Array.from(e.target.files);
             if (files.length > 2) {
                 alert('Solo puedes subir un máximo de 2 fotos de referencia.');
                 filesInput.value = '';
                 return;
             }
 
             uploadedDesignImages = [];
             previewsContainer.innerHTML = '';
             uploadStatus.textContent = 'Iniciando subida...';
 
             for (let i = 0; i < files.length; i++) {
                 const file = files[i];
                 uploadStatus.textContent = `Subiendo foto ${i + 1} de ${files.length}...`;
                 
                 // Show temporary thumbnail
                 const tempImg = document.createElement('img');
                 tempImg.src = URL.createObjectURL(file);
                 tempImg.style.width = '65px';
                 tempImg.style.height = '65px';
                 tempImg.style.objectFit = 'cover';
                 tempImg.style.borderRadius = '8px';
                 tempImg.style.border = '1px solid var(--color-border)';
                 tempImg.style.opacity = '0.5';
                 previewsContainer.appendChild(tempImg);
 
                 const formData = new FormData();
                 formData.append('image', file);
 
                 try {
                     const res = await fetch('/api/upload', {
                         method: 'POST',
                         body: formData
                     });
                     const data = await res.json();
                     
                     if (res.status === 200 && data.url) {
                         uploadedDesignImages.push(data.url);
                         tempImg.style.opacity = '1';
                         tempImg.src = data.url;
                     } else {
                         tempImg.remove();
                         alert(`Error al subir la foto ${i + 1}: ${data.error || 'Servidor'}`);
                     }
                 } catch (err) {
                     tempImg.remove();
                     console.error(err);
                     alert(`Error al conectar para subir la foto ${i + 1}`);
                 }
             }
 
             if (uploadedDesignImages.length > 0) {
                 uploadStatus.textContent = `¡Listo! ${uploadedDesignImages.length} foto(s) de referencia cargadas con éxito.`;
             } else {
                 uploadStatus.textContent = '';
             }
         });
     }
 
     // Load config and hydrate
     loadSettings();
 
     /* ==========================================================================
        7. SCROLL ENTRANCE ANIMATIONS (INTERSECTION OBSERVER)
        ========================================================================== */
     const animatedElements = document.querySelectorAll(
          '.hero-content, .hero-image-container, .comparison-card, .process-step, .testimonial-card, .calculator-info, .calculator-card'
     );
 
     animatedElements.forEach(el => {
         el.style.opacity = '0';
         el.style.transform = 'translateY(24px)';
         el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
     });
 
     const observerOptions = {
         root: null,
         rootMargin: '0px',
         threshold: 0.1
     };
 
     const observer = new IntersectionObserver((entries, observer) => {
         entries.forEach(entry => {
             if (entry.isIntersecting) {
                 entry.target.style.opacity = '1';
                 entry.target.style.transform = 'translateY(0)';
                 observer.unobserve(entry.target);
             }
         });
     }, observerOptions);
 
     animatedElements.forEach(el => {
         observer.observe(el);
     });
 
 });
