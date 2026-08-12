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
       3. INTERACTIVE VALUE CALCULATOR
       ========================================================================== */
    const sizeButtons = document.querySelectorAll('#size-options .option-btn');
    const flavorButtons = document.querySelectorAll('#flavor-options .option-btn');
    const designButtons = document.querySelectorAll('#design-options .option-btn');

    const hoursDisplay = document.getElementById('calc-hours-display');
    const ingredientsDisplay = document.getElementById('calc-ingredients-display');
    const priceDisplay = document.getElementById('calc-price-display');
    const whatsappSubmit = document.getElementById('whatsapp-submit');

    // State Variables
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

    // WhatsApp Form Submission
    whatsappSubmit.addEventListener('click', () => {
        const totalHours = selectedSize.hours + selectedDesign.hoursAdd;
        const baseCalculatedPrice = Math.round((selectedSize.price * selectedFlavor.factor) + selectedDesign.priceAdd);
        const priceMin = baseCalculatedPrice;
        const priceMax = baseCalculatedPrice + Math.round(selectedSize.price * 0.08);

        const phone = "51912345678"; // Representative WhatsApp contact in Peru
        
        // Build clear, informative WhatsApp copywriting
        const messageText = `¡Hola Plenilune Pastelería! 🌙 Vengo desde su página web y me gustaría cotizar una torta artesanal personalizada:

✨ *Detalles seleccionados:*
• *Porciones:* ${selectedSize.text}
• *Sabor/Relleno:* ${selectedFlavor.text}
• *Estilo de diseño:* ${selectedDesign.text}

⏱️ *Dedicación estimada:* ${totalHours} horas de trabajo artesanal.
💰 *Inversión aproximada:* ${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}

¿Tienen disponibilidad en su taller para la fecha de mi evento? Me gustaría coordinar más detalles del diseño y la entrega. ¡Muchas gracias!`;

        const encodedMessage = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
    });

    // Initial calculation call
    updateCalculator();

    /* ==========================================================================
       4. SCROLL ENTRANCE ANIMATIONS (INTERSECTION OBSERVER)
       ========================================================================== */
    const animatedElements = document.querySelectorAll(
        '.hero-content, .hero-image-container, .comparison-card, .process-step, .product-card, .testimonial-card, .calculator-info, .calculator-card, .instagram-item'
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
