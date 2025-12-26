class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.messageTextarea = document.getElementById('message');
        this.charCount = document.getElementById('charCount');

        // Modals
        this.previewModal = document.getElementById('previewModal');
        this.successModal = document.getElementById('successModal');
        this.previewClose = document.getElementById('previewClose');
        this.editMessage = document.getElementById('editMessage');
        this.confirmSend = document.getElementById('confirmSend');
        this.sendAnother = document.getElementById('sendAnother');

        // Autres éléments
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.notification = document.getElementById('notification');
        this.refreshCaptcha = document.getElementById('refreshCaptcha');

        // État du formulaire
        this.isSubmitting = false;
        this.captchaAnswer = null;

        this.initializeEventListeners();
        this.initializeValidation();
        this.generateCaptcha();
        this.updateCharCount();
    }

    initializeEventListeners() {
        // Soumission du formulaire
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Boutons d'action
        this.resetBtn.addEventListener('click', () => this.resetForm());
        this.previewBtn.addEventListener('click', () => this.showPreview());

        // Modals
        this.previewClose.addEventListener('click', () => this.hidePreviewModal());
        this.editMessage.addEventListener('click', () => this.hidePreviewModal());
        this.confirmSend.addEventListener('click', () => this.submitForm());
        this.sendAnother.addEventListener('click', () => this.resetAndHideSuccessModal());

        // Fermeture des modals en cliquant à l'extérieur
        [this.previewModal, this.successModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Compteur de caractères
        this.messageTextarea.addEventListener('input', () => this.updateCharCount());

        // Actualisation du captcha
        this.refreshCaptcha.addEventListener('click', () => this.generateCaptcha());

        // Validation en temps réel
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    initializeValidation() {
        // Règles de validation personnalisées
        this.validationRules = {
            firstName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
                message: {
                    required: 'Le prénom est obligatoire',
                    minLength: 'Le prénom doit contenir au moins 2 caractères',
                    maxLength: 'Le prénom ne peut pas dépasser 50 caractères',
                    pattern: 'Le prénom ne peut contenir que des lettres'
                }
            },
            lastName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
                message: {
                    required: 'Le nom est obligatoire',
                    minLength: 'Le nom doit contenir au moins 2 caractères',
                    maxLength: 'Le nom ne peut pas dépasser 50 caractères',
                    pattern: 'Le nom ne peut contenir que des lettres'
                }
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: {
                    required: 'L\'email est obligatoire',
                    pattern: 'Veuillez entrer une adresse email valide'
                }
            },
            phone: {
                pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                message: {
                    pattern: 'Veuillez entrer un numéro de téléphone valide'
                }
            },
            company: {
                maxLength: 100,
                message: {
                    maxLength: 'Le nom de la société ne peut pas dépasser 100 caractères'
                }
            },
            subject: {
                required: true,
                message: {
                    required: 'Veuillez sélectionner un sujet'
                }
            },
            message: {
                required: true,
                minLength: 10,
                maxLength: 1000,
                message: {
                    required: 'Le message est obligatoire',
                    minLength: 'Le message doit contenir au moins 10 caractères',
                    maxLength: 'Le message ne peut pas dépasser 1000 caractères'
                }
            },
            privacy: {
                required: true,
                message: {
                    required: 'Vous devez accepter la politique de confidentialité'
                }
            }
        };
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.validationRules[fieldName];

        if (!rules) return true;

        let isValid = true;
        let errorMessage = '';

        // Vérification required
        if (rules.required && !value) {
            isValid = false;
            errorMessage = rules.message.required;
        }
        // Vérification pattern
        else if (rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message.pattern;
        }
        // Vérification longueur minimale
        else if (rules.minLength && value && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message.minLength;
        }
        // Vérification longueur maximale
        else if (rules.maxLength && value && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = rules.message.maxLength;
        }

        this.showFieldError(field, errorMessage);
        this.updateFieldState(field, isValid);

        return isValid;
    }

    validateForm() {
        let isValid = true;
        const fields = this.form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validation du captcha
        const captchaField = document.getElementById('captchaAnswer');
        const captchaValue = captchaField.value.trim();

        if (!captchaValue || parseInt(captchaValue) !== this.captchaAnswer) {
            this.showFieldError(captchaField, 'La réponse au captcha est incorrecte');
            this.updateFieldState(captchaField, false);
            isValid = false;
        } else {
            this.clearFieldError(captchaField);
            this.updateFieldState(captchaField, true);
        }

        return isValid;
    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement && message) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    updateFieldState(field, isValid) {
        field.classList.remove('error', 'success');
        if (field.value.trim()) {
            field.classList.add(isValid ? 'success' : 'error');
        }
    }

    generateCaptcha() {
        // Génère une question mathématique simple
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operations = ['+', '-', '×'];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        let question, answer;

        switch (operation) {
            case '+':
                question = `${num1} + ${num2}`;
                answer = num1 + num2;
                break;
            case '-':
                question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
                answer = Math.max(num1, num2) - Math.min(num1, num2);
                break;
            case '×':
                question = `${num1} × ${num2}`;
                answer = num1 * num2;
                break;
        }

        document.getElementById('captchaQuestion').textContent = `Combien font ${question} ?`;
        this.captchaAnswer = answer;

        // Vider le champ de réponse
        document.getElementById('captchaAnswer').value = '';
        this.clearFieldError(document.getElementById('captchaAnswer'));
    }

    updateCharCount() {
        const count = this.messageTextarea.value.length;
        this.charCount.textContent = count;

        // Changer la couleur selon la longueur
        this.charCount.style.color = count > 900 ? '#f44336' : count > 800 ? '#ff9800' : '#666';
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        if (!this.validateForm()) {
            this.showNotification('Veuillez corriger les erreurs dans le formulaire', 'warning');
            // Scroller vers la première erreur
            const firstError = this.form.querySelector('.error-message.show');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        this.showPreview();
    }

    showPreview() {
        if (!this.validateForm()) {
            this.showNotification('Veuillez corriger les erreurs avant de prévisualiser', 'warning');
            return;
        }

        const formData = this.getFormData();
        const previewHTML = this.generatePreviewHTML(formData);

        document.getElementById('messagePreview').innerHTML = previewHTML;
        this.previewModal.classList.add('show');
    }

    hidePreviewModal() {
        this.previewModal.classList.remove('show');
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (key === 'priority') {
                // Pour les radio buttons, prendre seulement la valeur cochée
                const checkedRadio = this.form.querySelector(`input[name="${key}"]:checked`);
                if (checkedRadio) {
                    data[key] = checkedRadio.value;
                }
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    generatePreviewHTML(data) {
        const priorityLabels = {
            low: 'Basse',
            medium: 'Moyenne',
            high: 'Haute',
            urgent: 'Urgente'
        };

        return `
            <div class="message-preview">
                <h4>Informations personnelles</h4>
                <p><strong>Nom complet:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                ${data.phone ? `<p><strong>Téléphone:</strong> ${data.phone}</p>` : ''}
                ${data.company ? `<p><strong>Société:</strong> ${data.company}</p>` : ''}

                <h4>Détails du message</h4>
                <p><strong>Sujet:</strong> ${data.subject}</p>
                <p><strong>Priorité:</strong> ${priorityLabels[data.priority] || data.priority}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 10px; border-radius: 4px;">${data.message}</p>

                ${data.newsletter ? '<p><strong>✓</strong> Abonnement à la newsletter demandé</p>' : ''}
                <p><strong>✓</strong> Politique de confidentialité acceptée</p>
            </div>
        `;
    }

    async submitForm() {
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        this.hidePreviewModal();
        this.showLoading();

        try {
            // Simulation d'envoi (remplacer par votre logique d'envoi réelle)
            await this.simulateSubmission();

            this.hideLoading();
            this.showSuccess();
            this.resetForm();

        } catch (error) {
            this.hideLoading();
            this.showNotification('Erreur lors de l\'envoi du message. Veuillez réessayer.', 'error');
            console.error('Erreur d\'envoi:', error);
        } finally {
            this.isSubmitting = false;
        }
    }

    simulateSubmission() {
        return new Promise((resolve, reject) => {
            // Simulation d'un délai réseau
            setTimeout(() => {
                // Simulation d'une faible chance d'erreur
                if (Math.random() < 0.1) {
                    reject(new Error('Erreur de réseau'));
                } else {
                    resolve();
                }
            }, 2000);
        });
    }

    showLoading() {
        this.loadingIndicator.style.display = 'block';
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Envoi en cours...</span>';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Envoyer le message</span>';
    }

    showSuccess() {
        const formData = this.getFormData();
        const successHTML = this.generateSuccessHTML(formData);

        document.getElementById('sentMessageDetails').innerHTML = successHTML;
        this.successModal.classList.add('show');
    }

    generateSuccessHTML(data) {
        return `
            <h5>Détails de l'envoi:</h5>
            <p><strong>Destinataire:</strong> ${data.email}</p>
            <p><strong>Sujet:</strong> ${data.subject}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>ID du message:</strong> MSG-${Date.now()}</p>
        `;
    }

    resetAndHideSuccessModal() {
        this.successModal.classList.remove('show');
        this.resetForm();
    }

    resetForm() {
        this.form.reset();
        this.form.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
        });
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.classList.remove('error', 'success');
        });
        this.generateCaptcha();
        this.updateCharCount();
        this.isSubmitting = false;
    }

    showNotification(message, type = 'info') {
        const notificationText = document.getElementById('notificationText');
        const notificationIcon = this.notification.querySelector('i');

        notificationText.textContent = message;

        // Changer l'icône selon le type
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        notificationIcon.className = `fas ${icons[type] || 'fa-info-circle'}`;

        // Changer la couleur selon le type
        const colors = {
            success: '#4CAF50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196F3'
        };
        this.notification.querySelector('.notification-content').style.background = colors[type] || colors.info;

        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 5000);
    }

    hideModal(modal) {
        modal.classList.remove('show');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    console.error('Erreur dans le formulaire de contact:', e.message);
});

// Polyfill pour les navigateurs anciens
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        let el = this;
        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
