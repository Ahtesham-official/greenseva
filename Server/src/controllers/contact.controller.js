const Contact = require('../DB/Contact.schema.js');

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ err: true, message: 'Name, email, and message are required.' });
    }

    try {
      const contactDoc = new Contact({ name, email, subject, message });
      await contactDoc.save();
    } catch (e) {}

    return res.status(200).json({
      err: false,
      message: 'Thank you for contacting GreenSeva! Our sustainability team will get back to you shortly.',
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

module.exports = { submitContact };
