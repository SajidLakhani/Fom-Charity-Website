"use strict";
(function() {
    // Global variables
    let
        userAgent = navigator.userAgent.toLowerCase(),
        isIE = userAgent.indexOf("msie") !== -1 ? parseInt(userAgent.split("msie")[1], 10) : userAgent.indexOf("trident") !== -1 ? 11 : userAgent.indexOf("edge") !== -1 ? 12 : false;

    // Unsupported browsers
    if (isIE !== false && isIE < 12) {
        console.warn("[Core] detected IE" + isIE + ", load alert");
        var script = document.createElement("script");
        script.src = "./js/support.js";
        document.querySelector("head").appendChild(script);
    }

    let
        initialDate = new Date(),

        $document = $(document),
        $window = $(window),
        $html = $("html"),
        $body = $("body"),

        isDesktop = $html.hasClass("desktop"),
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        windowReady = false,
        isNoviBuilder = false,
        livedemo = true,

        plugins = {
            bootstrapModal: $('.modal'),
            captcha: $('.recaptcha'),
            campaignMonitor: $('.campaign-mailform'),
            copyrightYear: $('.copyright-year'),
            checkbox: $('input[type="checkbox"]'),
            owl: $('.owl-carousel'),
            preloader: $('.preloader'),
            rdNavbar: $('.rd-navbar'),
            rdMailForm: $('.rd-mailform'),
            rdInputLabel: $('.form-label'),
            regula: $('[data-constraints]'),
            radio: $('input[type="radio"]'),
            wow: $('.wow'),
            maps: $('.google-map-container')
        };

    /**
     * @desc Check the element was been scrolled into the view
     * @param {object} elem - jQuery object
     * @return {boolean}
     */
    function isScrolledIntoView(elem) {
        if (isNoviBuilder) return true;
        return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
    }

    /**
     * @desc Calls a function when element has been scrolled into the view
     * @param {object} element - jQuery object
     * @param {function} func - init function
     */
    function lazyInit(element, func) {
        let scrollHandler = function() {
            if ((!element.hasClass('lazy-loaded') && (isScrolledIntoView(element)))) {
                func.call(element);
                element.addClass('lazy-loaded');
            }
        };

        scrollHandler();
        $window.on('scroll', scrollHandler);
    }

    // Initialize scripts that require a loaded window
    $window.on('load', function() {
        // Page loader & Page transition
        if (plugins.preloader.length && !isNoviBuilder) {
            pageTransition({
                target: document.querySelector('.page'),
                delay: 0,
                duration: 500,
                classIn: 'fadeIn',
                classOut: 'fadeOut',
                classActive: 'animated',
                conditions: function(event, link) {
                    return link && !/(\#|javascript:void\(0\)|callto:|tel:|mailto:|:\/\/)/.test(link) && !event.currentTarget.hasAttribute('data-lightgallery');
                },
                onTransitionStart: function(options) {
                    setTimeout(function() {
                        plugins.preloader.removeClass('loaded');
                    }, options.duration * .75);
                },
                onReady: function() {
                    plugins.preloader.addClass('loaded');
                    windowReady = true;
                }
            });
        }
    });

    // Initialize scripts that require a finished document
    $(function() {
        isNoviBuilder = window.xMode;

        /**
         * Wrapper to eliminate json errors
         * @param {string} str - JSON string
         * @returns {object} - parsed or empty object
         */
        function parseJSON(str) {
            try {
                if (str) return JSON.parse(str);
                else return {};
            } catch (error) {
                console.warn(error);
                return {};
            }
        }

        /**
         * @desc Attach form validation to elements
         * @param {object} elements - jQuery object
         */
        function attachFormValidator(elements) {
            // Custom validator - phone number
            regula.custom({
                name: 'PhoneNumber',
                defaultMessage: 'Invalid phone number format',
                validator: function() {
                    if (this.value === '') return true;
                    else return /^(\+\d)?[0-9\-\(\) ]{5,}$/i.test(this.value);
                }
            });

            for (let i = 0; i < elements.length; i++) {
                let o = $(elements[i]),
                    v;
                o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
                v = o.parent().find(".form-validation");
                if (v.is(":last-child")) o.addClass("form-control-last-child");
            }

            elements.on('input change propertychange blur', function(e) {
                let $this = $(this),
                    results;

                if (e.type !== "blur")
                    if (!$this.parent().hasClass("has-error")) return;
                if ($this.parents('.rd-mailform').hasClass('success')) return;

                if ((results = $this.regula('validate')).length) {
                    for (let i = 0; i < results.length; i++) {
                        $this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error");
                    }
                } else {
                    $this.siblings(".form-validation").text("").parent().removeClass("has-error")
                }
            }).regula('bind');

            let regularConstraintsMessages = [{
                    type: regula.Constraint.Required,
                    newMessage: "The text field is required."
                },
                {
                    type: regula.Constraint.Email,
                    newMessage: "The email is not a valid email."
                },
                {
                    type: regula.Constraint.Numeric,
                    newMessage: "Only numbers are required"
                },
                {
                    type: regula.Constraint.Selected,
                    newMessage: "Please choose an option."
                }
            ];


            for (let i = 0; i < regularConstraintsMessages.length; i++) {
                let regularConstraint = regularConstraintsMessages[i];

                regula.override({
                    constraintType: regularConstraint.type,
                    defaultMessage: regularConstraint.newMessage
                });
            }
        }

        /**
         * @desc Check if all elements pass validation
         * @param {object} elements - object of items for validation
         * @param {object} captcha - captcha object for validation
         * @return {boolean}
         */
        function isValidated(elements, captcha) {
            let results, errors = 0;

            if (elements.length) {
                for (let j = 0; j < elements.length; j++) {

                    let $input = $(elements[j]);
                    if ((results = $input.regula('validate')).length) {
                        for (let k = 0; k < results.length; k++) {
                            errors++;
                            $input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
                        }
                    } else {
                        $input.siblings(".form-validation").text("").parent().removeClass("has-error")
                    }
                }

                if (captcha) {
                    if (captcha.length) {
                        return validateReCaptcha(captcha) && errors === 0
                    }
                }

                return errors === 0;
            }
            return true;
        }

        /**
         * @desc Validate google reCaptcha
         * @param {object} captcha - captcha object for validation
         * @return {boolean}
         */
        function validateReCaptcha(captcha) {
            let captchaToken = captcha.find('.g-recaptcha-response').val();

            if (captchaToken.length === 0) {
                captcha
                    .siblings('.form-validation')
                    .html('Please, prove that you are not robot.')
                    .addClass('active');
                captcha
                    .closest('.form-wrap')
                    .addClass('has-error');

                captcha.on('propertychange', function() {
                    let $this = $(this),
                        captchaToken = $this.find('.g-recaptcha-response').val();

                    if (captchaToken.length > 0) {
                        $this
                            .closest('.form-wrap')
                            .removeClass('has-error');
                        $this
                            .siblings('.form-validation')
                            .removeClass('active')
                            .html('');
                        $this.off('propertychange');
                    }
                });

                return false;
            }

            return true;
        }

        /**
         * @desc Initialize Google reCaptcha
         */
        window.onloadCaptchaCallback = function() {
            for (let i = 0; i < plugins.captcha.length; i++) {
                let
                    $captcha = $(plugins.captcha[i]),
                    resizeHandler = (function() {
                        let
                            frame = this.querySelector('iframe'),
                            inner = this.firstElementChild,
                            inner2 = inner.firstElementChild,
                            containerRect = null,
                            frameRect = null,
                            scale = null;

                        inner2.style.transform = '';
                        inner.style.height = 'auto';
                        inner.style.width = 'auto';

                        containerRect = this.getBoundingClientRect();
                        frameRect = frame.getBoundingClientRect();
                        scale = containerRect.width / frameRect.width;

                        if (scale < 1) {
                            inner2.style.transform = 'scale(' + scale + ')';
                            inner.style.height = (frameRect.height * scale) + 'px';
                            inner.style.width = (frameRect.width * scale) + 'px';
                        }
                    }).bind(plugins.captcha[i]);

                grecaptcha.render(
                    $captcha.attr('id'), {
                        sitekey: $captcha.attr('data-sitekey'),
                        size: $captcha.attr('data-size') ? $captcha.attr('data-size') : 'normal',
                        theme: $captcha.attr('data-theme') ? $captcha.attr('data-theme') : 'light',
                        callback: function() {
                            $('.recaptcha').trigger('propertychange');
                        }
                    }
                );

                $captcha.after("<span class='form-validation'></span>");

                if (plugins.captcha[i].hasAttribute('data-auto-size')) {
                    resizeHandler();
                    window.addEventListener('resize', resizeHandler);
                }
            }
        };

        /**
         * @desc Google map function for getting latitude and longitude
         */
        function getLatLngObject(str, marker, map, callback) {
            let coordinates = {};
            try {
                coordinates = JSON.parse(str);
                callback(new google.maps.LatLng(
                    coordinates.lat,
                    coordinates.lng
                ), marker, map)
            } catch (e) {
                map.geocoder.geocode({ 'address': str }, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        let latitude = results[0].geometry.location.lat();
                        let longitude = results[0].geometry.location.lng();

                        callback(new google.maps.LatLng(
                            parseFloat(latitude),
                            parseFloat(longitude)
                        ), marker, map)
                    }
                })
            }
        }

        /**
         * @desc Initialize Google maps
         */
        function initMaps() {
            let key;

            for (let i = 0; i < plugins.maps.length; i++) {
                if (plugins.maps[i].hasAttribute("data-key")) {
                    key = plugins.maps[i].getAttribute("data-key");
                    break;
                }
            }

            $.getScript('//maps.google.com/maps/api/js?' + (key ? 'key=' + key + '&' : '') + 'libraries=geometry,places&v=quarterly', function() {
                let head = document.getElementsByTagName('head')[0],
                    insertBefore = head.insertBefore;

                head.insertBefore = function(newElement, referenceElement) {
                    if (newElement.href && newElement.href.indexOf('//fonts.googleapis.com/css?family=Roboto') !== -1 || newElement.innerHTML.indexOf('gm-style') !== -1) {
                        return;
                    }
                    insertBefore.call(head, newElement, referenceElement);
                };
                let geocoder = new google.maps.Geocoder;
                for (let i = 0; i < plugins.maps.length; i++) {
                    let zoom = parseInt(plugins.maps[i].getAttribute("data-zoom"), 10) || 11;
                    let styles = plugins.maps[i].hasAttribute('data-styles') ? JSON.parse(plugins.maps[i].getAttribute("data-styles")) : [];
                    let center = plugins.maps[i].getAttribute("data-center") || "New York";

                    // Initialize map
                    let map = new google.maps.Map(plugins.maps[i].querySelectorAll(".google-map")[0], {
                        zoom: zoom,
                        styles: styles,
                        scrollwheel: false,
                        center: {
                            lat: 0,
                            lng: 0
                        }
                    });

                    // Add map object to map node
                    plugins.maps[i].map = map;
                    plugins.maps[i].geocoder = geocoder;
                    plugins.maps[i].keySupported = true;
                    plugins.maps[i].google = google;

                    // Get Center coordinates from attribute
                    getLatLngObject(center, null, plugins.maps[i], function(location, markerElement, mapElement) {
                        mapElement.map.setCenter(location);
                    });

                    // Add markers from google-map-markers array
                    let markerItems = plugins.maps[i].querySelectorAll(".google-map-markers li");

                    if (markerItems.length) {
                        let markers = [];
                        for (let j = 0; j < markerItems.length; j++) {
                            let markerElement = markerItems[j];
                            getLatLngObject(markerElement.getAttribute("data-location"), markerElement, plugins.maps[i], function(location, markerElement, mapElement) {
                                let icon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
                                let activeIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active");
                                let info = markerElement.getAttribute("data-description") || "";
                                let infoWindow = new google.maps.InfoWindow({
                                    content: info
                                });
                                markerElement.infoWindow = infoWindow;
                                let markerData = {
                                    position: location,
                                    map: mapElement.map
                                }
                                if (icon) {
                                    markerData.icon = icon;
                                }
                                let marker = new google.maps.Marker(markerData);
                                markerElement.gmarker = marker;
                                markers.push({
                                    markerElement: markerElement,
                                    infoWindow: infoWindow
                                });
                                marker.isActive = false;
                                // Handle infoWindow close click
                                google.maps.event.addListener(infoWindow, 'closeclick', (function(markerElement, mapElement) {
                                    let markerIcon = null;
                                    markerElement.gmarker.isActive = false;
                                    markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
                                    markerElement.gmarker.setIcon(markerIcon);
                                }).bind(this, markerElement, mapElement));


                                // Set marker active on Click and open infoWindow
                                google.maps.event.addListener(marker, 'click', (function(markerElement, mapElement) {
                                    let markerIcon;
                                    if (markerElement.infoWindow.getContent().length === 0) return;
                                    let gMarker, currentMarker = markerElement.gmarker,
                                        currentInfoWindow;
                                    for (let k = 0; k < markers.length; k++) {
                                        if (markers[k].markerElement === markerElement) {
                                            currentInfoWindow = markers[k].infoWindow;
                                        }
                                        gMarker = markers[k].markerElement.gmarker;
                                        if (gMarker.isActive && markers[k].markerElement !== markerElement) {
                                            gMarker.isActive = false;
                                            markerIcon = markers[k].markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")
                                            gMarker.setIcon(markerIcon);
                                            markers[k].infoWindow.close();
                                        }
                                    }

                                    currentMarker.isActive = !currentMarker.isActive;
                                    if (currentMarker.isActive) {
                                        if (markerIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active")) {
                                            currentMarker.setIcon(markerIcon);
                                        }

                                        currentInfoWindow.open(map, marker);
                                    } else {
                                        if (markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")) {
                                            currentMarker.setIcon(markerIcon);
                                        }
                                        currentInfoWindow.close();
                                    }
                                }).bind(this, markerElement, mapElement))
                            })
                        }
                    }
                }
            });
        }

        // Google ReCaptcha
        if (plugins.captcha.length) {
            $.getScript("//www.google.com/recaptcha/api.js?onload=onloadCaptchaCallback&render=explicit&hl=en");
        }

        // Additional class on html if mac os.
        if (navigator.platform.match(/(Mac)/i)) {
            $html.addClass("mac-os");
        }

        // Adds some loosing functionality to IE browsers (IE Polyfills)
        if (isIE) {
            if (isIE === 12) $html.addClass("ie-edge");
            if (isIE === 11) $html.addClass("ie-11");
            if (isIE < 10) $html.addClass("lt-ie-10");
            if (isIE < 11) $html.addClass("ie-10");
        }

        // Bootstrap Modal
        if (plugins.bootstrapModal.length) {
            for (let i = 0; i < plugins.bootstrapModal.length; i++) {
                let modalItem = $(plugins.bootstrapModal[i]);

                modalItem.on('hidden.bs.modal', $.proxy(function() {
                    let activeModal = $(this),
                        rdVideoInside = activeModal.find('video'),
                        youTubeVideoInside = activeModal.find('iframe');

                    if (rdVideoInside.length) {
                        rdVideoInside[0].pause();
                    }

                    if (youTubeVideoInside.length) {
                        let videoUrl = youTubeVideoInside.attr('src');

                        youTubeVideoInside
                            .attr('src', '')
                            .attr('src', videoUrl);
                    }
                }, modalItem))
            }
        }

        // Copyright Year (Evaluates correct copyright year)
        if (plugins.copyrightYear.length) {
            plugins.copyrightYear.text(initialDate.getFullYear());
        }

        // Google maps
        if (plugins.maps.length) {
            lazyInit(plugins.maps, initMaps);
        }

        // Add custom styling options for input[type="radio"]
        if (plugins.radio.length) {
            for (let i = 0; i < plugins.radio.length; i++) {
                $(plugins.radio[i]).addClass("radio-custom").after("<span class='radio-custom-dummy'></span>")
            }
        }

        // Add custom styling options for input[type="checkbox"]
        if (plugins.checkbox.length) {
            for (let i = 0; i < plugins.checkbox.length; i++) {
                $(plugins.checkbox[i]).addClass("checkbox-custom").after("<span class='checkbox-custom-dummy'></span>")
            }
        }

        // UI To Top
        if (isDesktop && !isNoviBuilder) {
            $().UItoTop({
                easingType: 'easeOutQuad',
                containerClass: 'ui-to-top fa fa-angle-up'
            });
        }

        // RD Navbar
        if (plugins.rdNavbar.length) {
            let
                navbar = plugins.rdNavbar,
                aliases = {
                    '-': 0,
                    '-sm-': 576,
                    '-md-': 768,
                    '-lg-': 992,
                    '-xl-': 1200,
                    '-xxl-': 1600
                },
                responsive = {},
                navItems = $('.rd-nav-item');

            for (let i = 0; i < navItems.length; i++) {
                let node = navItems[i];

                if (node.classList.contains('opened')) {
                    node.classList.remove('opened')
                }
            }

            for (let alias in aliases) {
                let link = responsive[aliases[alias]] = {};
                if (navbar.attr('data' + alias + 'layout')) link.layout = navbar.attr('data' + alias + 'layout');
                if (navbar.attr('data' + alias + 'device-layout')) link.deviceLayout = navbar.attr('data' + alias + 'device-layout');
                if (navbar.attr('data' + alias + 'hover-on')) link.focusOnHover = navbar.attr('data' + alias + 'hover-on') === 'true';
                if (navbar.attr('data' + alias + 'auto-height')) link.autoHeight = navbar.attr('data' + alias + 'auto-height') === 'true';
                if (navbar.attr('data' + alias + 'stick-up-offset')) link.stickUpOffset = navbar.attr('data' + alias + 'stick-up-offset');
                if (navbar.attr('data' + alias + 'stick-up')) link.stickUp = navbar.attr('data' + alias + 'stick-up') === 'true';
                if (isNoviBuilder) link.stickUp = false;
                else if (navbar.attr('data' + alias + 'stick-up')) link.stickUp = navbar.attr('data' + alias + 'stick-up') === 'true';
            }

            plugins.rdNavbar.RDNavbar({
                anchorNav: !isNoviBuilder,
                stickUpClone: (plugins.rdNavbar.attr("data-stick-up-clone") && !isNoviBuilder) ? plugins.rdNavbar.attr("data-stick-up-clone") === 'true' : false,
                responsive: responsive,
                callbacks: {
                    onStuck: function() {
                        let navbarSearch = this.$element.find('.rd-search input');

                        if (navbarSearch) {
                            navbarSearch.val('').trigger('propertychange');
                        }
                    },
                    onDropdownOver: function() {
                        return !isNoviBuilder;
                    },
                    onUnstuck: function() {
                        if (this.$clone === null)
                            return;

                        let navbarSearch = this.$clone.find('.rd-search input');

                        if (navbarSearch) {
                            navbarSearch.val('').trigger('propertychange');
                            navbarSearch.trigger('blur');
                        }

                    }
                }
            });
        }

        // Owl carousel
        if (plugins.owl.length) {
            for (let i = 0; i < plugins.owl.length; i++) {
                let
                    node = plugins.owl[i],
                    params = parseJSON(node.getAttribute('data-owl')),
                    defaults = {
                        items: 1,
                        margin: 30,
                        loop: true,
                        mouseDrag: true,
                        stagePadding: 0,
                        nav: false,
                        navText: [],
                        dots: false,
                        autoplay: true,
                        autoplayTimeout: 3000,
                        autoplayHoverPause: true
                    },
                    xMode = {
                        autoplay: false,
                        loop: false,
                        mouseDrag: false
                    },
                    generated = {
                        autoplay: node.getAttribute('data-autoplay') === 'true',
                        loop: node.getAttribute('data-loop') !== 'false',
                        mouseDrag: node.getAttribute('data-mouse-drag') !== 'false',
                        responsive: {}
                    },
                    aliases = ['-', '-sm-', '-md-', '-lg-', '-xl-', '-xxl-'],
                    values = [0, 576, 768, 992, 1200, 1600],
                    responsive = generated.responsive;

                for (let j = 0; j < values.length; j++) {
                    responsive[values[j]] = {};

                    for (let k = j; k >= -1; k--) {
                        if (!responsive[values[j]]['items'] && node.getAttribute('data' + aliases[k] + 'items')) {
                            responsive[values[j]]['items'] = k < 0 ? 1 : parseInt(node.getAttribute('data' + aliases[k] + 'items'), 10);
                        }
                        if (!responsive[values[j]]['stagePadding'] && responsive[values[j]]['stagePadding'] !== 0 && node.getAttribute('data' + aliases[k] + 'stage-padding')) {
                            responsive[values[j]]['stagePadding'] = k < 0 ? 0 : parseInt(node.getAttribute('data' + aliases[k] + 'stage-padding'), 10);
                        }
                        if (!responsive[values[j]]['margin'] && responsive[values[j]]['margin'] !== 0 && node.getAttribute('data' + aliases[k] + 'margin')) {
                            responsive[values[j]]['margin'] = k < 0 ? 30 : parseInt(node.getAttribute('data' + aliases[k] + 'margin'), 10);
                        }
                    }
                }

                // Initialize lightgallery items in cloned owl items
                // $(node).on('initialized.owl.carousel', function () {
                // 	initLightGalleryItem($(node).find('[data-lightgallery="item"]'), 'lightGallery-in-carousel');
                // });

                node.owl = $(node);
                $(node).owlCarousel(Util.merge(isNoviBuilder ? [defaults, params, generated, xMode] : [defaults, params, generated]));
            }
        }

        // WOW
        if ($html.hasClass("wow-animation") && plugins.wow.length && !isNoviBuilder && isDesktop) {
            new WOW().init();
        }

        // RD Input Label
        if (plugins.rdInputLabel.length) {
            plugins.rdInputLabel.RDInputLabel();
        }

        // Regula
        if (plugins.regula.length) {
            attachFormValidator(plugins.regula);
        }

        // RD Mailform
        if (plugins.rdMailForm.length) {
            let i, j, k,
                msg = {
                    'MF000': 'Successfully sent!',
                    'MF001': 'Recipients are not set!',
                    'MF002': 'Form will not work locally!',
                    'MF003': 'Please, define email field in your form!',
                    'MF004': 'Please, define type of your form!',
                    'MF254': 'Something went wrong with PHPMailer!',
                    'MF255': 'Aw, snap! Something went wrong.'
                };

            for (i = 0; i < plugins.rdMailForm.length; i++) {
                let $form = $(plugins.rdMailForm[i]),
                    formHasCaptcha = false;

                $form.attr('novalidate', 'novalidate').ajaxForm({
                    data: {
                        "form-type": $form.attr("data-form-type") || "contact",
                        "counter": i
                    },
                    beforeSubmit: function(arr, $form, options) {
                        if (isNoviBuilder)
                            return;

                        let form = $(plugins.rdMailForm[this.extraData.counter]),
                            inputs = form.find("[data-constraints]"),
                            output = $("#" + form.attr("data-form-output")),
                            captcha = form.find('.recaptcha'),
                            captchaFlag = true;

                        output.removeClass("active error success");

                        if (isValidated(inputs, captcha)) {

                            // veify reCaptcha
                            if (captcha.length) {
                                let captchaToken = captcha.find('.g-recaptcha-response').val(),
                                    captchaMsg = {
                                        'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
                                        'CPT002': 'Something wrong with google reCaptcha'
                                    };

                                formHasCaptcha = true;

                                $.ajax({
                                        method: "POST",
                                        url: "bat/reCaptcha.php",
                                        data: { 'g-recaptcha-response': captchaToken },
                                        async: false
                                    })
                                    .done(function(responceCode) {
                                        if (responceCode !== 'CPT000') {
                                            if (output.hasClass("snackbars")) {
                                                output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')

                                                setTimeout(function() {
                                                    output.removeClass("active");
                                                }, 3500);

                                                captchaFlag = false;
                                            } else {
                                                output.html(captchaMsg[responceCode]);
                                            }

                                            output.addClass("active");
                                        }
                                    });
                            }

                            if (!captchaFlag) {
                                return false;
                            }

                            form.addClass('form-in-process');

                            if (output.hasClass("snackbars")) {
                                output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>');
                                output.addClass("active");
                            }
                        } else {
                            return false;
                        }
                    },
                    error: function(result) {
                        if (isNoviBuilder)
                            return;

                        let output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output")),
                            form = $(plugins.rdMailForm[this.extraData.counter]);

                        output.text(msg[result]);
                        form.removeClass('form-in-process');

                        if (formHasCaptcha) {
                            grecaptcha.reset();
                            window.dispatchEvent(new Event('resize'));
                        }
                    },
                    success: function(result) {
                        if (isNoviBuilder)
                            return;

                        let form = $(plugins.rdMailForm[this.extraData.counter]),
                            output = $("#" + form.attr("data-form-output")),
                            select = form.find('select');

                        form
                            .addClass('success')
                            .removeClass('form-in-process');

                        if (formHasCaptcha) {
                            grecaptcha.reset();
                            window.dispatchEvent(new Event('resize'));
                        }

                        result = result.length === 5 ? result : 'MF255';
                        output.text(msg[result]);

                        if (result === "MF000") {
                            if (output.hasClass("snackbars")) {
                                output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
                            } else {
                                output.addClass("active success");
                            }
                        } else {
                            if (output.hasClass("snackbars")) {
                                output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
                            } else {
                                output.addClass("active error");
                            }
                        }

                        form.clearForm();

                        if (select.length) {
                            select.select2("val", "");
                        }

                        form.find('input, textarea').trigger('blur');

                        setTimeout(function() {
                            output.removeClass("active error success");
                            form.removeClass('success');
                        }, 3500);
                    }
                });
            }
        }
    });
}());