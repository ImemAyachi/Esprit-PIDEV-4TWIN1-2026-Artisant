import Document from '../models/Document.js';
import Consultation from '../models/Consultation.js';


// @desc    Get all documents
// @route   GET /api/documents
export const getAllDocuments = async (req, res) => {
    try {
        const { search, type, project, product } = req.query;
        let query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (type) query.type = type;
        if (project) query.project = project;
        if (product) query.product = product;

        const documents = await Document.find(query).populate('project product');
        res.status(200).json({ status: 'success', results: documents.length, data: { documents } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single document
// @route   GET /api/documents/:id
export const getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('project product');
        if (!document) return res.status(404).json({ message: 'Document not found' });
        res.status(200).json({ status: 'success', data: { document } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new document
// @route   POST /api/documents
export const createDocument = async (req, res) => {
    try {
        const { title, name, fileUrl, type } = req.body;
        
        // Map types for frontend compatibility
        const typeMapping = {
            'Technical Sheet': 'fiche technique',
            'fiche technique': 'fiche technique',
            'Certification': 'certification',
            'Manual': 'manuel',
            'autre': 'autre'
        };

        const document = await Document.create({
            ...req.body,
            name: name || title || 'Sans titre', // Frontend uses 'title'
            type: typeMapping[type] || 'autre',
            fileUrl: fileUrl || 'https://placeholder.com/asset.pdf',
            uploadedBy: req.user.id
        });

        res.status(201).json({ status: 'success', data: { document } });
    } catch (err) {
        console.error('Document Ingestion Failure:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Update document
// @route   PUT /api/documents/:id
export const updateDocument = async (req, res) => {
    try {
        const document = await Document.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!document) return res.status(404).json({ message: 'Document not found' });
        res.status(200).json({ status: 'success', data: { document } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findByIdAndDelete(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });
        res.status(200).json({ status: 'success', data: {} });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// @desc    Toggle document favorite
// @route   PUT /api/documents/:id/favorite
export const toggleFavorite = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const isFavorited = document.favoritedBy.includes(req.user.id);
        
        if (isFavorited) {
            document.favoritedBy = document.favoritedBy.filter(id => id.toString() !== req.user.id.toString());
        } else {
            document.favoritedBy.push(req.user.id);
        }

        await document.save();
        res.status(200).json({ status: 'success', data: { document } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get document consultation history
// @route   GET /api/documents/history
export const getDocumentHistory = async (req, res) => {
    try {
        const history = await Consultation.find({ user: req.user.id })
            .populate('document')
            .sort({ createdAt: -1 });

        // Map for frontend compatibility if needed
        const formattedHistory = history.map(h => ({
            _id: h._id,
            item: h.document,
            lastViewed: h.createdAt,
            timeSpent: h.timeSpent,
            action: h.action,
            interactions: [{ type: h.action }]
        }));

        res.status(200).json({ success: true, data: formattedHistory });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Log document consultation
// @route   POST /api/documents/:id/consult
export const logConsultation = async (req, res) => {
    try {
        const { action, timeSpent } = req.body;
        const consultation = await Consultation.create({
            user: req.user.id,
            document: req.params.id,
            action: action || 'view',
            timeSpent: timeSpent || 30 // Default time if viewed
        });
        res.status(201).json({ success: true, data: consultation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
