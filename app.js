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
        2. FAQ ACCORDION LOGIC
        ========================================================================== */
     const faqItems = document.querySelectorAll('.faq-item');
 
     faqItems.forEach(item => {
         const trigger = item.querySelector('.faq-trigger');
         
         trigger.addEventListener('click', () => {
             const isOpen = item.classList.contains('open');
             
             // Close all items
             faqItems.forEach(otherItem => {
                 otherItem.classList.remove('open');
             });
             
             // Toggle current item
             if (!isOpen) {
                 item.classList.add('open');
             }
         });
     });
 
     /* ==========================================================================
        3. INTERACTIVE VALUE CALCULATOR STATE & REGULAR SETUP
        ========================================================================== */
     const sizeButtons = document.querySelectorAll('#size-options .option-btn');
     const flavorButtons = document.querySelectorAll('#flavor-options .option-btn');
     const designButtons = document.querySelectorAll('#design-options .option-btn');
 
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
     let selectedSize = {
         value: "10",
         hours: 3.0,
         price: 90,
         text: "10 personas"
     };
 
     let selectedFlavor = {
         value: "frutal",
         factor: 1.0,
         desc: "Mantequilla 82%, limón natural, coulis de frambuesa y mascarpone fresco.",
         text: "Cítrico y Frutal"
     };
 
     let selectedDesign = {
         value: "minimal",
         hoursAdd: 0,
         priceAdd: 0,
         desc: "Texturizado sutil con espátula, elegante y minimalista.",
         text: "Minimalista Texturada"
     };
 
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
         // Calculate dynamic values
         const totalHours = selectedSize.hours + selectedDesign.hoursAdd;
         
         // Base Price * Flavor Factor + Design Price Addition
         const baseCalculatedPrice = Math.round((selectedSize.price * selectedFlavor.factor) + selectedDesign.priceAdd);
         
         // Build a range to sound consultative and flexible
         const priceMin = baseCalculatedPrice;
         const priceMax = baseCalculatedPrice + Math.round(selectedSize.price * 0.08); // 8% range variation
         
         // Update values in HTML
         hoursDisplay.innerHTML = `<strong>${totalHours} Horas</strong> de batido, horneado, ensamblado manual y decoración a mano.`;
         ingredientsDisplay.innerHTML = `<strong>${selectedFlavor.text}</strong>: ${selectedFlavor.desc}`;
         priceDisplay.textContent = `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`;
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
 
     // Size Selection Setup
     setupOptionGroup(sizeButtons, (btn) => {
         selectedSize = {
             value: btn.getAttribute('data-value'),
             hours: parseFloat(btn.getAttribute('data-hours')),
             price: parseInt(btn.getAttribute('data-price')),
             text: btn.querySelector('strong').textContent
         };
         updateCalculator();
     });
 
     // Flavor Selection Setup
     setupOptionGroup(flavorButtons, (btn) => {
         selectedFlavor = {
             value: btn.getAttribute('data-value'),
             factor: parseFloat(btn.getAttribute('data-factor')),
             desc: btn.getAttribute('data-desc'),
             text: btn.querySelector('strong').textContent
         };
         updateCalculator();
     });
 
     // Design Selection Setup
     setupOptionGroup(designButtons, (btn) => {
         selectedDesign = {
             value: btn.getAttribute('data-value'),
             hoursAdd: parseFloat(btn.getAttribute('data-hours-add')),
             priceAdd: parseInt(btn.getAttribute('data-price-add')),
             desc: btn.getAttribute('data-desc'),
             text: btn.querySelector('strong').textContent
         };
         updateCalculator();
     });
 
     // Wizard step transition listeners
     btnNextStep.addEventListener('click', () => {
         const name = clientNameInput.value.trim();
         const email = clientEmailInput.value.trim();
         const whatsapp = clientWhatsappInput.value.trim();
 
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
         const baseCalculatedPrice = Math.round((selectedSize.price * selectedFlavor.factor) + selectedDesign.priceAdd);
         const priceMin = baseCalculatedPrice;
         const priceMax = baseCalculatedPrice + Math.round(selectedSize.price * 0.08);
         
         const name = clientNameInput.value.trim();
         const email = clientEmailInput.value.trim();
         const whatsapp = clientWhatsappInput.value.trim();
 
         // Build clear, informative WhatsApp copywriting prepended with customer details
         const messageText = `¡Hola Plenilune Pastelería! \u{1F319} Vengo desde su página web y me gustaría cotizar una torta artesanal personalizada:
 
 \u{1F464} *Datos de Contacto:*
 • *Cliente:* ${name}
 • *Email:* ${email}
 • *WhatsApp:* ${whatsapp}
 
 \u{2728} *Detalles seleccionados:*
 • *Porciones:* ${selectedSize.text}
 • *Sabor/Relleno:* ${selectedFlavor.text}
 • *Estilo de diseño:* ${selectedDesign.text}
  
 \u{23F1}\u{FE0F} *Dedicación estimada:* ${totalHours} horas de trabajo artesanal.
 \u{1F4B0} *Inversión aproximada:* ${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}
  
 ¿Tienen disponibilidad en su taller para la fecha de mi evento? Me gustaría coordinar más detalles del diseño y la entrega. ¡Muchas gracias!`;
 
         const encodedMessage = encodeURIComponent(messageText);
         const whatsappUrl = `https://api.whatsapp.com/send?phone=${contactPhone}&text=${encodedMessage}`;
         
         // Open WhatsApp in new tab
         window.open(whatsappUrl, '_blank');
     });
 
     /* ==========================================================================
        4. CAROUSEL ENGINE LOGIC
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
 
         // Attach event listeners to newly generated indicators
         const indicators = indicatorsContainer.querySelectorAll('.indicator');
         indicators.forEach(ind => {
             ind.addEventListener('click', () => {
                 currentSlide = parseInt(ind.getAttribute('data-slide'));
                 updateSlide();
             });
         });
     };
 
     /* ==========================================================================
        5. FETCH CONFIG & HYDRATION
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
 
             // Hydrate Catalog Items in gallery (Null-safe for backward compatibility)
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
                     
                     // Add indicator dot
                     const indicator = document.createElement('span');
                     indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
                     indicator.setAttribute('data-slide', i);
                     indicatorsContainer.appendChild(indicator);
                 }
                 
                 setupCarousel(totalSlides);
             }
 
             // Hydrate Calculator values in buttons
             sizeButtons.forEach(btn => {
                 const val = btn.getAttribute('data-value');
                 if (config.calculator.sizes[val]) {
                     btn.setAttribute('data-price', config.calculator.sizes[val].price);
                     btn.setAttribute('data-hours', config.calculator.sizes[val].hours);
                     const span = btn.querySelector('span');
                     if (span) span.textContent = config.calculator.sizes[val].desc;
                 }
             });
 
             flavorButtons.forEach(btn => {
                 const val = btn.getAttribute('data-value');
                 if (config.calculator.flavors[val]) {
                     btn.setAttribute('data-factor', config.calculator.flavors[val].factor);
                     btn.setAttribute('data-desc', config.calculator.flavors[val].desc);
                     const strong = btn.querySelector('strong');
                     if (strong) strong.textContent = config.calculator.flavors[val].title;
                 }
             });
 
             designButtons.forEach(btn => {
                 const val = btn.getAttribute('data-value');
                 if (config.calculator.designs[val]) {
                     btn.setAttribute('data-price-add', config.calculator.designs[val].priceAdd);
                     btn.setAttribute('data-hours-add', config.calculator.designs[val].hoursAdd);
                     const strong = btn.querySelector('strong');
                     if (strong) strong.textContent = config.calculator.designs[val].title;
                 }
             });
 
             // Re-initialize active variables with newly loaded values
             const activeSizeBtn = document.querySelector('#size-options .option-btn.active');
             if (activeSizeBtn) {
                 selectedSize = {
                     value: activeSizeBtn.getAttribute('data-value'),
                     hours: parseFloat(activeSizeBtn.getAttribute('data-hours')),
                     price: parseInt(activeSizeBtn.getAttribute('data-price')),
                     text: activeSizeBtn.querySelector('strong').textContent
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
                     text: activeDesignBtn.querySelector('strong').textContent
                 };
             }
 
             // Update calculator view
             updateCalculator();
 
         } catch (err) {
             console.warn('Failed to load settings from API, using default fallbacks:', err);
             updateCalculator();
         }
     };
 
     // Load config and hydrate
     loadSettings();
 
     /* ==========================================================================
        6. SCROLL ENTRANCE ANIMATIONS (INTERSECTION OBSERVER)
        ========================================================================== */
     const animatedElements = document.querySelectorAll(
         '.hero-content, .hero-image-container, .comparison-card, .process-step, .testimonial-card, .calculator-info, .calculator-card'
     );
 
     // Setup animated styling dynamically to avoid layout shifting if JS fails
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
