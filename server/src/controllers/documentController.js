const Document = require('../models/Document');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public
exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find();
        res.status(200).json({
            status: 'success',
            results: documents.length,
            data: {
                documents,
            },
        });
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
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.status(200).json({
            status: 'success',
            data: {
                document,
            },
        });
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

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Make sure user is document owner or admin
        if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to update this document' });
        }

        document = await Document.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            data: {
                document,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        const Profile = require('../models/Profile');
        let profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const isFavorited = profile.favoriteDocuments.includes(req.params.id);

        if (isFavorited) {
            profile.favoriteDocuments = profile.favoriteDocuments.filter(
                (docId) => docId.toString() !== req.params.id
            );
        } else {
            profile.favoriteDocuments.push(req.params.id);
        }

        await profile.save();

        res.status(200).json({
            status: 'success',
            data: {
                favorites: profile.favoriteDocuments,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
