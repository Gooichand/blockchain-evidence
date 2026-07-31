(function () {
  'use strict';

  // ============================================================
  // EMAILJS CONFIGURATION
  // Get these from https://dashboard.emailjs.com (free account)
  // 1. Email Services -> add Gmail (connects via Google OAuth, no app password)
  // 2. Email Templates -> create template with variables:
  //    {{from_name}} {{reply_to}} {{subject}} {{message}} {{details}}
  //    Email subject:  {{subject}}  (or use the template's own subject line)
  // 3. Account -> General -> copy Public Key, Service ID, Template ID below
  //    (Public Key is designed to be used in the browser - it is not a secret)
  // ============================================================
  var EMAILJS_CONFIG = {
    enabled: true,
    publicKey: '6mz83XIozwHx7uxC-',
    serviceId: 'service_8iavnoi',
    templateId: 'template_awxvpgl',
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var nameInput = document.getElementById('contactName');
    var emailInput = document.getElementById('contactEmail');
    var subjectInput = document.getElementById('contactSubject');
    var messageInput = document.getElementById('contactMessage');
    var submitBtn = document.getElementById('contactSubmitBtn');
    var statusBox = document.getElementById('contactStatus');
    var charCount = document.getElementById('contactCharCount');

    var RULES = {
      name: { min: 2, max: 60, pattern: /^[^<>]+$/i, message: 'Please enter your name (2–60 characters).' },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        message: 'Please enter a valid email address.',
      },
      subject: { min: 3, max: 100, pattern: /^[^<>]+$/i, message: 'Subject must be between 3 and 100 characters.' },
      message: { min: 10, max: 2000, message: 'Message must be between 10 and 2000 characters.' },
    };

    var validators = {
      name: function () {
        var v = nameInput.value.trim();
        if (!v) return 'Name is required.';
        if (v.length < RULES.name.min || v.length > RULES.name.max) return RULES.name.message;
        if (!RULES.name.pattern.test(v)) return 'Name cannot contain angle brackets.';
        return '';
      },
      email: function () {
        var v = emailInput.value.trim();
        if (!v) return 'Email is required.';
        if (!RULES.email.pattern.test(v)) return RULES.email.message;
        return '';
      },
      subject: function () {
        var v = subjectInput.value.trim();
        if (!v) return 'Subject is required.';
        if (v.length < RULES.subject.min || v.length > RULES.subject.max) return RULES.subject.message;
        if (!RULES.subject.pattern.test(v)) return 'Subject cannot contain angle brackets.';
        return '';
      },
      message: function () {
        var v = messageInput.value.trim();
        if (!v) return 'Please write a message.';
        if (v.length < RULES.message.min || v.length > RULES.message.max) return RULES.message.message;
        return '';
      },
    };

    function setFieldState(field, shell, errorEl, error) {
      if (error) {
        shell.classList.add('invalid');
        errorEl.textContent = error;
        errorEl.classList.add('visible');
        field.setAttribute('aria-invalid', 'true');
      } else {
        shell.classList.remove('invalid');
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
        field.removeAttribute('aria-invalid');
      }
    }

    function validateField(fieldName, field, shell, errorEl) {
      setFieldState(field, shell, errorEl, validators[fieldName]());
    }

    function validateAll() {
      var firstInvalid = null;
      var pairs = [
        ['name', nameInput, 'contactNameError'],
        ['email', emailInput, 'contactEmailError'],
        ['subject', subjectInput, 'contactSubjectError'],
        ['message', messageInput, 'contactMessageError'],
      ];

      pairs.forEach(function (pair) {
        var name = pair[0];
        var input = pair[1];
        var errorEl = document.getElementById(pair[2]);
        var shell = input.closest('.contact-input-shell');
        validateField(name, input, shell, errorEl);
        if (errorEl.textContent && !firstInvalid) firstInvalid = input;
      });

      return firstInvalid;
    }

    // Live validation on blur, cleanup on input
    [
      [nameInput, 'contactNameError'],
      [emailInput, 'contactEmailError'],
      [subjectInput, 'contactSubjectError'],
      [messageInput, 'contactMessageError'],
    ].forEach(function (pair) {
      var input = pair[0];
      var errorEl = document.getElementById(pair[1]);
      var shell = input.closest('.contact-input-shell');

      input.addEventListener('blur', function () {
        validateField(pair[2], input, shell, errorEl);
      });

      input.addEventListener('input', function () {
        if (errorEl.classList.contains('visible')) {
          setFieldState(input, shell, errorEl, validators[pair[2]]());
        }
        if (input === messageInput && charCount) {
          charCount.textContent = input.value.length + ' / 2000';
        }
      });
    });

    // Character counter
    if (messageInput && charCount) {
      charCount.textContent = messageInput.value.length + ' / 2000';
    }

    // Button ripple
    submitBtn.addEventListener('click', function (e) {
      if (submitBtn.disabled) return;
      var rect = submitBtn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'contact-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      submitBtn.appendChild(ripple);
      ripple.addEventListener('animationend', function () {
        ripple.remove();
      });
    });

    // Status helpers
    function showStatus(type, title, text) {
      if (!statusBox) return;
      var isSuccess = type === 'success';
      var icon = isSuccess ? 'check-circle-2' : 'alert-circle';
      statusBox.innerHTML =
        '<div class="contact-status-card contact-status-' +
        type +
        '" role="' +
        (isSuccess ? 'status' : 'alert') +
        '">' +
        '<span class="contact-status-icon" aria-hidden="true"><i data-lucide="' +
        icon +
        '"></i></span>' +
        '<div><strong>' +
        title +
        '</strong><span>' +
        text +
        '</span></div>' +
        '</div>';
      statusBox.classList.add('show');
      statusBox.classList.remove('hidden');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function clearStatus() {
      if (!statusBox) return;
      statusBox.classList.remove('show');
      statusBox.innerHTML = '';
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('loading', loading);
      submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
    }

    // Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (submitBtn.disabled) return;
      clearStatus();

      var firstInvalid = validateAll();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var payload = new FormData(form);
      var body = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        subject: subjectInput.value.trim(),
        message: messageInput.value.trim(),
        website: payload.get('website') || '',
      };

      setLoading(true);

      if (EMAILJS_CONFIG.enabled && typeof emailjs !== 'undefined') {
        sendViaEmailJS(body);
      } else {
        sendViaBackend(body);
      }
    });

    function sendViaEmailJS(body) {
      var details = {
        timestamp: new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'short',
        }),
        browser: navigator.userAgent,
      };

      emailjs
        .send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          {
            from_name: body.name,
            reply_to: body.email,
            from_email: body.email,
            subject: body.subject,
            message: body.message,
            details: 'Submitted: ' + details.timestamp + ' | Browser: ' + details.browser,
          },
          { publicKey: EMAILJS_CONFIG.publicKey },
        )
        .then(function () {
          handleSuccess();
        })
        .catch(function (err) {
          console.error('EmailJS error:', err);
          handleError('Unable to send message. Please try again later.');
        })
        .finally(function () {
          setLoading(false);
        });
    }

    function sendViaBackend(body) {
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            handleSuccess();
          } else {
            handleError((result.data && result.data.error) || 'Please try again later.');
          }
        })
        .catch(function () {
          handleError('Please try again later.');
        })
        .finally(function () {
          setLoading(false);
        });
    }

    function handleSuccess() {
      showStatus('success', 'Message Sent Successfully', 'We will contact you within 24 hours.');
      form.reset();
      if (charCount) charCount.textContent = '0 / 2000';
      var timer = setTimeout(function () {
        clearStatus();
      }, 8000);
      form.addEventListener('input', function onResetInput() {
        clearTimeout(timer);
        clearStatus();
        form.removeEventListener('input', onResetInput);
      });
    }

    function handleError(message) {
      showStatus('error', 'Unable to send message', message);
    }

    // Scroll reveal (lazy: observer only activates when section nears viewport)
    var section = document.getElementById('contact');
    if (section && 'IntersectionObserver' in window) {
      var revealEls = [
        section.querySelector('.contact-hero-inner'),
        section.querySelector('.contact-form-wrap'),
      ];
      revealEls.forEach(function (el) {
        if (!el) return;
        el.classList.add('contact-reveal');
      });

      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('contact-reveal-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
      );

      revealEls.forEach(function (el) {
        if (el) observer.observe(el);
      });
    }
  });
})();
