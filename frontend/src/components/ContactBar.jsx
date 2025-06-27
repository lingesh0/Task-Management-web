import React from 'react';
import '../css/ContactBar.css';

const ContactBar = () => (
  <div className="contact-bar">
    <div className="contact-info">
      <div>Contact: <a href="mailto:support@taskapp.com">support@taskapp.com</a></div>
      <div>Phone: <a href="tel:+1234567890">+1 234 567 890</a></div>
      <div className="contact-copyright">&copy; {new Date().getFullYear()} Task Management App</div>
    </div>
  </div>
);

export default ContactBar; 