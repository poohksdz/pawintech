import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { toast } from 'react-toastify';

import { useSendEmailMutation } from '../slices/emailApiSlice'
import Button from './ui/Button';
import Input from './ui/Input';

const ContactComponent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [sendEmail, { isLoading }] = useSendEmailMutation();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await sendEmail({
        username: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      }).unwrap();
    } catch (err) {
      toast.error("Failed to create post. Please try again.");
    }

    // Send email using EmailJS
    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          name: formData.name,
          email: formData.email, // Sender's email
          subject: formData.subject,
          phone: formData.phone,
          message: formData.message,
          reply_to: formData.email, // Ensure the reply goes to the user's email
        },
        process.env.REACT_APP_EMAILJS_USER_ID
      )
      .then(
        (response) => {
          toast.success('Your message has been sent!');

          // Reset form after successful submission
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
          });
        },
        (error) => {
          console.error('Error sending email:', error);
          toast.error(`Error: ${error.text}`);
        }
      );
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Contact Us</h2>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Name Field */}
            <div>
              <Input
                label="Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            {/* Email Field */}
            <div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </div>

            {/* Phone Field */}
            <div>
              <Input
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="08X-XXX-XXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Subject Field */}
            <div>
              <Input
                label="Subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help?"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Message Field (Full Width) */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                required
                placeholder="Write your message here..."
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto px-8"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactComponent;
