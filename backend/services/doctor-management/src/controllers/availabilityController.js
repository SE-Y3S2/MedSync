const Availability = require('../models/Availability');

exports.addSlot = async (req, res) => {
  try {
    const slot = new Availability({ ...req.body, doctorId: req.params.id });
    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSlots = async (req, res) => {
  try {
    const slots = await Availability.find({ doctorId: req.params.id });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Availability.findByIdAndDelete(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
