const express = require('express');
const OnlyDevGate = require('../models/OnlyDevGate');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่าน' });
    }

    const gate = await OnlyDevGate.findOne();
    if (!gate) {
      return res.status(500).json({ success: false, message: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่าน' });
    }

    const valid = await gate.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('OnlyDev verify error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
