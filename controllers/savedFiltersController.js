// S3: saved tag filters, one row per (user, name)
const { supabase } = require('../config');
const { getAuthUser, getStableWallet } = require('../middleware/identity');

const userKey = (req, authUser) => getStableWallet(req) || `user_${authUser.id}`;

const isValidFilter = (f) => {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return false;
  if (!Array.isArray(f.tagIds) || f.tagIds.length === 0) return false;
  if (!f.tagIds.every((t) => Number.isInteger(t) && t > 0)) return false;
  if (!['AND', 'OR'].includes(f.logic)) return false;
  return true;
};

const listFilters = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { data, error } = (await supabase
      .from('saved_filters')
      .select('id, name, filter, created_at')
      .eq('user_key', userKey(req, authUser))
      .order('created_at', { ascending: false })) || {};

    if (error) throw error;
    res.json({ success: true, filters: data });
  } catch (error) {
    console.error('List saved filters error:', error);
    res.status(500).json({ success: false, error: 'Failed to load saved filters' });
  }
};

const createFilter = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { name, filter } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Filter name is required' });
    }
    if (String(name).trim().length > 80) {
      return res.status(400).json({ success: false, error: 'Filter name is too long (80 characters max)' });
    }
    if (!isValidFilter(filter)) {
      return res.status(400).json({ success: false, error: 'Filter must be { tagIds: number[], logic: "AND" | "OR" }' });
    }

    const { data, error } = (await supabase
      .from('saved_filters')
      .upsert(
        { user_key: userKey(req, authUser), name: String(name).trim(), filter: { tagIds: filter.tagIds, logic: filter.logic } },
        { onConflict: 'user_key,name' }
      )
      .select()
      .single()) || {};

    if (error) throw error;
    res.json({ success: true, filter: data });
  } catch (error) {
    console.error('Create saved filter error:', error);
    res.status(500).json({ success: false, error: 'Failed to save filter' });
  }
};

const deleteFilter = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { error } = (await supabase
      .from('saved_filters')
      .delete()
      .eq('id', req.params.id)
      .eq('user_key', userKey(req, authUser))) || {};

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete saved filter error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete filter' });
  }
};

module.exports = { listFilters, createFilter, deleteFilter };
