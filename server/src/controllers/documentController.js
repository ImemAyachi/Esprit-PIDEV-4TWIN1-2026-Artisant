const Document = require('../models/Document');
const ConsultationHistory = require('../models/ConsultationHistory');
const Favorite = require('../models/Favorite');
const mongoose = require('mongoose');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public
exports.getAllDocuments = async (req, res) => {
    try {
        const { search, folder, tag, type } = req.query;
        let query = { isArchived: false };

        if (search) {
            query.$text = { $search: search };
        }
        if (folder) query['folder.name'] = folder;
        if (tag) query.tags = { $in: [tag] };
        if (type) query.type = type;

        const documents = await Document.find(query).populate('uploadedBy', 'companyName');
        res.status(200).json({ status: 'success', results: documents.length, data: { documents } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Public
exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // Check sharing permissions if not owner/admin
        if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            const share = document.sharing.find(s => 
                (s.user && s.user.toString() === req.user.id) || 
                (s.role && s.role === req.user.role)
            );
            if (!share) return res.status(403).json({ message: 'No authorized clearance for this asset' });
        }

        // Track Consultation
        await ConsultationHistory.findOneAndUpdate(
            { user: req.user._id, item: document._id, type: 'Document' },
            { $set: { lastViewed: new Date() }, $inc: { timeSpent: 30 } },
            { upsert: true }
        );

        res.status(200).json({ status: 'success', data: { document } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new document
// @route   POST /api/documents
// @access  Private/Admin/Expert
exports.createDocument = async (req, res) => {
    try {
        // Add user to req.body
        req.body.uploadedBy = req.user.id;

        const document = await Document.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                document,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private/Admin/Expert
exports.updateDocument = async (req, res) => {
    try {
        let document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Handle Versioning if fileUrl changed
        if (req.body.fileUrl && req.body.fileUrl !== document.fileUrl) {
            document.versions.push({
                version: document.versions.length + 1,
                url: document.fileUrl,
                uploadedBy: document.uploadedBy,
                date: document.updatedAt
            });
        }

        Object.assign(document, req.body);
        await document.save();

        res.status(200).json({ status: 'success', data: { document } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Download Document
// @route   GET /api/documents/:id/download
exports.downloadDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Not found' });

        // Audit Log
        document.downloadLog.push({
            user: req.user._id,
            ip: req.ip,
            purpose: req.query.purpose || 'General Use'
        });
        await document.save();

        res.json({ success: true, url: document.fileUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Share Document
// @route   POST /api/documents/:id/share
exports.shareDocument = async (req, res) => {
    try {
        const { userId, role, permissions, expiresAt } = req.body;
        const document = await Document.findById(req.params.id);
        
        document.sharing.push({ user: userId, role, permissions, expiresAt });
        await document.save();
        
        res.json({ success: true, message: 'Sharing node established' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private/Admin/Expert
exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Make sure user is document owner or admin
        if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to delete this document' });
        }

        await document.deleteOne();

        res.status(200).json({
            status: 'success',
            data: {},
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Toggle favorite document
// @route   PUT /api/documents/:id/favorite
// @access  Private
exports.favoriteDocument = async (req, res) => {
    try {
        const { folder, note } = req.body;
        const existing = await Favorite.findOne({ user: req.user.id, item: req.params.id });

        if (existing) {
            await Favorite.findByIdAndDelete(existing._id);
            res.status(200).json({ status: 'success', message: 'Asset removed from watchlist' });
        } else {
            await Favorite.create({
                user: req.user.id,
                type: 'Document',
                item: req.params.id,
                folder: folder || 'General',
                note
            });
            res.status(201).json({ status: 'success', message: 'Asset added to watchlist' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get Consultation History
// @route   GET /api/documents/history
exports.getConsultationHistory = async (req, res) => {
    try {
        const history = await ConsultationHistory.find({ user: req.user.id })
            .populate('item')
            .sort({ lastViewed: -1 });
        res.json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Revert Document Version
// @route   POST /api/documents/:id/revert/:version
exports.revertDocumentVersion = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        const versionNode = document.versions.id(req.params.versionId);

        if (!versionNode) return res.status(404).json({ message: 'Version not found' });

        document.fileUrl = versionNode.url;
        await document.save();
        res.json({ success: true, message: 'Source URL recalibrated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
