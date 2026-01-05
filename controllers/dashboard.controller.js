const supabase = require('../config/supabase');
const { validateWalletAddress } = require('../utils/validation');

// Get dashboard statistics for user
exports.getStats = async (req, res) => {
    try {
        const userWallet = req.headers['x-user-wallet'];

        if (!userWallet || !validateWalletAddress(userWallet)) {
            return res.status(401).json({ error: 'Invalid user wallet' });
        }

        // Get user info
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (!user) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        let stats = {};

        // Get case counts based on role
        if (user.role === 'investigator') {
            const { count: activeCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('investigator_id', user.id)
                .in('status', ['CREATED', 'OPEN', 'ANALYZING']);

            const { count: totalCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('investigator_id', user.id);

            stats = {
                activeCases: activeCases || 0,
                totalCases: totalCases || 0,
                pendingAnalysis: 0,
                awaitingLegal: 0
            };
        } else if (user.role === 'forensic_analyst') {
            const { count: assignedCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_analyst_id', user.id)
                .eq('status', 'ANALYZING');

            stats = {
                assignedCases: assignedCases || 0,
                completedThisMonth: 0
            };
        } else if (user.role === 'admin') {
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: totalCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true });

            const { count: totalEvidence } = await supabase
                .from('evidence')
                .select('*', { count: 'exact', head: true });

            stats = {
                totalUsers: totalUsers || 0,
                totalCases: totalCases || 0,
                totalEvidence: totalEvidence || 0,
                serverStatus: 'operational'
            };
        }

        res.json({ stats });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
};
