const express = require('express');
const { body, validationResult } = require('express-validator');
const HookData = require('../models/HookData');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const normalizeThaiMobile10 = (input) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  let digitsOnly = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    if (!trimmed.startsWith('+66') || !digitsOnly.startsWith('66')) return null;
    digitsOnly = '0' + digitsOnly.substring(2);
  }
  if (digitsOnly.length !== 10) return null;
  const prefix2 = digitsOnly.substring(0, 2);
  if (prefix2 !== '06' && prefix2 !== '08' && prefix2 !== '09') return null;
  return digitsOnly;
};

const normalizePhoneNumbers = (lines) => {
  const result = [];
  const seen = new Set();
  for (const line of lines) {
    const normalized = normalizeThaiMobile10(line);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
};

router.post('/upload',
  authenticateToken,
  [body('phoneNumbers').isArray({ min: 1 }).withMessage('Phone numbers required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (!currentUser.featureLocalData) {
        return res.status(403).json({ success: false, message: 'Local DATA not enabled' });
      }

      const normalizedNumbers = normalizePhoneNumbers(req.body.phoneNumbers);
      if (normalizedNumbers.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid phone numbers' });
      }

      const hookData = await HookData.create({
        uploadedBy: currentUser._id,
        team: currentUser.team || null,
        phoneNumbers: normalizedNumbers,
        totalCount: normalizedNumbers.length,
        fileName: req.body.fileName || null
      });

      res.json({
        success: true,
        data: {
          id: hookData._id,
          totalCount: hookData.totalCount,
          uploadedAt: hookData.uploadedAt
        }
      });
    } catch (error) {
      console.error('HookData upload error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Head')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const query = currentUser.role === 'Head' && currentUser.team
      ? { team: currentUser.team }
      : {};

    const list = await HookData.find(query)
      .select('totalCount fileName uploadedAt uploadedBy team')
      .populate('uploadedBy', 'user')
      .populate('team', 'name')
      .sort({ uploadedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: list.map((item, index) => ({
        _id: item._id,
        no: index + 1,
        user: item.uploadedBy?.user || '-',
        team: item.team?.name || '-',
        uploadedAt: item.uploadedAt,
        totalCount: item.totalCount,
        fileName: item.fileName
      }))
    });
  } catch (error) {
    console.error('HookData list error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Head')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const hookData = await HookData.findById(req.params.id).populate('uploadedBy', 'user');
    if (!hookData) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (currentUser.role === 'Head' && currentUser.team &&
        String(hookData.team) !== String(currentUser.team)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const d = new Date(hookData.uploadedAt);
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const timeStr = `${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
    const fileName = `วันที่${dateStr} เวลา ${timeStr} จำนวน ${hookData.totalCount} เบอร์.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(hookData.phoneNumbers.join('\n'));
  } catch (error) {
    console.error('HookData download error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Head')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const hookData = await HookData.findById(req.params.id);
    if (!hookData) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (currentUser.role === 'Head' && currentUser.team &&
        String(hookData.team) !== String(currentUser.team)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await HookData.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (error) {
    console.error('HookData delete error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
