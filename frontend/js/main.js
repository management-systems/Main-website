import { initNavbar } from './modules/navbar.js';
import { initAnimations } from './modules/animations.js';
import { initContactForm } from './modules/contact.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAnimations();
  initContactForm();
});
