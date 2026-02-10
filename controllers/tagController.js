const { supabase } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');

// Get all tags with usage statistics
const getAllTags = async (req, res) => {
    try {
        const { data: tags, error } = await supabase
            .from('tags')
            .select('*')
            .order('usage_count', { ascending: false });

        if (error) throw error;

        res.json({ success: true, tags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
};

// Create new tag
const createTag = async (req, res) => {
    try {
        const { name, color, category, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        const { data: tag, error } = await supabase
            .from('tags')
            .insert({
                name: name.trim().toLowerCase(),
                color: color || '#3B82F6',
                category: category || 'general',
                created_by: userWallet
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Tag already exists' });
            }
            throw error;
        }

        res.json({ success: true, tag });
    } catch (error) {
        console.error('Create tag error:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
};

// Add tags to evidence
const addTagsToEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const { tagIds, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!tagIds || !Array.isArray(tagIds)) {
            return res.status(400).json({ error: 'Tag IDs array is required' });
        }

        const evidenceTags = tagIds.map(tagId => ({
            evidence_id: parseInt(id),
            tag_id: tagId,
            tagged_by: userWallet
        }));

        const { data, error } = await supabase
            .from('evidence_tags')
            .insert(evidenceTags)
            .select();

        if (error) throw error;

        res.json({ success: true, evidence_tags: data });
    } catch (error) {
        console.error('Add evidence tags error:', error);
        res.status(500).json({ error: 'Failed to add tags to evidence' });
    }
};

// Remove tag from evidence
const removeTagFromEvidence = async (req, res) => {
    try {
        const { id, tagId } = req.params;
        const { userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { error } = await supabase
            .from('evidence_tags')
            .delete()
            .eq('evidence_id', id)
            .eq('tag_id', tagId)
            .eq('tagged_by', userWallet);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Remove evidence tag error:', error);
        res.status(500).json({ error: 'Failed to remove tag from evidence' });
    }
};

// Batch tag operations
const batchTag = async (req, res) => {
    try {
        const { evidenceIds, tagIds, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!evidenceIds || !Array.isArray(evidenceIds) || !tagIds || !Array.isArray(tagIds)) {
            return res.status(400).json({ error: 'Evidence IDs and tag IDs arrays are required' });
        }

        const evidenceTags = [];
        evidenceIds.forEach(evidenceId => {
            tagIds.forEach(tagId => {
                evidenceTags.push({
                    evidence_id: evidenceId,
                    tag_id: tagId,
                    tagged_by: userWallet
                });
            });
        });

        const { data, error } = await supabase
            .from('evidence_tags')
            .insert(evidenceTags)
            .select();

        if (error) throw error;

        res.json({ success: true, tagged_count: data.length });
    } catch (error) {
        console.error('Batch tag error:', error);
        res.status(500).json({ error: 'Failed to batch tag evidence' });
    }
};

// Filter evidence by tags
const filterByTags = async (req, res) => {
    try {
        const { tagIds, logic = 'AND' } = req.query;

        if (!tagIds) {
            return res.status(400).json({ error: 'Tag IDs are required' });
        }

        const tagIdArray = tagIds.split(',').map(id => parseInt(id.trim()));

        let query;
        if (logic === 'OR') {
            query = supabase
                .from('evidence')
                .select(`
                    *,
                    evidence_tags!inner(
                        tag_id,
                        tags(name, color)
                    )
                `)
                .in('evidence_tags.tag_id', tagIdArray);
        } else {
            query = supabase.rpc('get_evidence_with_all_tags', {
                tag_ids: tagIdArray
            });
        }

        const { data: evidence, error } = await query;

        if (error) throw error;

        res.json({ success: true, evidence, filter_logic: logic });
    } catch (error) {
        console.error('Filter by tags error:', error);
        res.status(500).json({ error: 'Failed to filter evidence by tags' });
    }
};

// Auto-suggest tags
const suggestTags = async (req, res) => {
    try {
        const { query = '', limit = 10 } = req.query;

        const { data: tags, error } = await supabase
            .from('tags')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('usage_count', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        res.json({ success: true, suggestions: tags });
    } catch (error) {
        console.error('Tag suggest error:', error);
        res.status(500).json({ error: 'Failed to get tag suggestions' });
    }
};

module.exports = {
    getAllTags,
    createTag,
    addTagsToEvidence,
    removeTagFromEvidence,
    batchTag,
    filterByTags,
    suggestTags
};
