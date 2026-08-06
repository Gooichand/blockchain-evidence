const { supabase } = require('../config');
const { createNotification } = require('../services/notificationService');
const { createStatusChangeNotification } = require('../services/caseHelpers');

// Get cases for timeline
const getCases = async (req, res) => {
  try {
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: cases, error } = (await supabase
      .from('cases')
      .select('id, title, description, status, created_date')
      .order('created_date', { ascending: false })) || {};
    
    if (error) throw error;
    res.json({ success: true, data: cases });
  } catch (error) {
    console.error('Get cases error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get cases' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get all case statuses
const getCaseStatuses = async (req, res) => {
  try {
    const { data: statuses, error } = (await supabase
      .from('case_statuses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })) || {};
    
    if (error) throw error;
    res.json({ success: true, data: statuses });
  } catch (error) {
    console.error('Get case statuses error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get case statuses' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get cases with enhanced filtering
const getEnhancedCases = async (req, res) => {
  try {
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      status,
      priority,
      assignedTo,
      caseType,
      jurisdiction,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created_date',
      sortOrder = 'desc',
    } = req.query;

    let query = supabase
      .from('cases')
      .select(
        `*, case_statuses!inner(status_code, status_name, color_code, icon), case_assignments!left(assigned_to, role_type, assignment_type, assigned_at)`,
      );

    if (status) query = query.eq('case_statuses.status_code', status);
    if (priority) query = query.eq('priority_level', priority);
    if (assignedTo)
      query = query.or(
        `assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`,
      );
    if (caseType) query = query.eq('case_type', caseType);
    if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
    if (dateFrom) query = query.gte('created_date', dateFrom);
    if (dateTo) query = query.lte('created_date', dateTo);
    
    // BUG FIX: Enhanced search sanitization
    if (search) {
      const sanitizedSearch = search.replace(/[%_.*(),'"]/g, '').trim();
      if (sanitizedSearch) {
        query = query.or(
          `title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,case_number.ilike.%${sanitizedSearch}%`,
        );
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;
    
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limitNum - 1);

    const { data: cases, error } = await query;
    if (error) throw error;

    const { count: totalCount } = (await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })) || {};

    res.json({
      success: true,
      data: cases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('Get enhanced cases error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get cases' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Create new case
const createCase = async (req, res) => {
  try {
    // SECURITY FIX: Use verified wallet from session
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      title,
      description,
      priority_level,
      case_type,
      jurisdiction,
      estimated_completion,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Case title is required' });
    }

    // Check user permissions to create cases
    const { data: user } = (await supabase
      .from('users')
      .select('role')
      .eq('wallet_address', verifiedWallet)
      .eq('is_active', true)
      .single()) || {};

    if (!user || !['admin', 'investigator', 'evidence_manager'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to create cases' });
    }

    const { data: defaultStatus } = (await supabase
      .from('case_statuses')
      .select('id')
      .eq('status_code', 'open')
      .single()) || {};

    const { data: newCase, error } = (await supabase
      .from('cases')
      .insert({
        title,
        description: description || '',
        priority_level: parseInt(priority_level) || 3,
        case_type: case_type || 'criminal',
        jurisdiction: jurisdiction || 'local',
        estimated_completion,
        created_by: verifiedWallet, // SECURITY FIX
        status_id: defaultStatus?.id || 1,
        status_changed_by: verifiedWallet, // SECURITY FIX
      })
      .select()
      .single()) || {};

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_wallet: verifiedWallet,
      action: 'case_created',
      details: JSON.stringify({ case_id: newCase.id, case_title: title, case_type }),
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: newCase });
  } catch (error) {
    console.error('Create case error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to create case' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get case details with full status history
const getCaseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const verifiedWallet = req.authenticatedWallet;

    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid case ID' });
    }

    const { data: caseData, error: caseError } = (await supabase
      .from('cases')
      .select(`*, case_statuses(status_code, status_name, color_code, icon, description)`)
      .eq('id', safeId)
      .single()) || {};
    
    if (caseError || !caseData) return res.status(404).json({ success: false, error: 'Case not found' });

    const { data: statusHistory, error: historyError } = (await supabase
      .from('case_status_history')
      .select(
        `*, from_status:case_statuses!case_status_history_from_status_id_fkey(status_name, color_code), to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)`,
      )
      .eq('case_id', safeId)
      .order('created_at', { ascending: false })) || {};
    
    if (historyError) throw historyError;

    const { data: assignments, error: assignmentError } = (await supabase
      .from('case_assignments')
      .select('*')
      .eq('case_id', safeId)
      .eq('is_active', true)) || {};
    
    if (assignmentError) throw assignmentError;

    const { count: evidenceCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .eq('case_id', safeId)) || {};

    res.json({
      success: true,
      data: {
        ...caseData,
        status_history: statusHistory,
        assignments,
        evidence_count: evidenceCount || 0,
      },
    });
  } catch (error) {
    console.error('Get case details error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get case details' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Update case status with validation
const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatusCode, reason, metadata = {} } = req.body;
    
    // SECURITY FIX: Use verified identity
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid case ID' });
    }

    const { data: user, error: userError } = (await supabase
      .from('users')
      .select('role')
      .eq('wallet_address', verifiedWallet)
      .eq('is_active', true)
      .single()) || {};
    
    if (userError || !user) return res.status(403).json({ success: false, error: 'User not found or inactive' });

    const { data: currentCase, error: caseError } = (await supabase
      .from('cases')
      .select('status_id, case_statuses(status_code)')
      .eq('id', safeId)
      .single()) || {};
    
    if (caseError || !currentCase) return res.status(404).json({ success: false, error: 'Case not found' });

    const { data: newStatus, error: statusError } = (await supabase
      .from('case_statuses')
      .select('id')
      .eq('status_code', newStatusCode)
      .single()) || {};
    
    if (statusError || !newStatus) return res.status(400).json({ success: false, error: 'Invalid status code' });

    // Transition validation
    const { data: transition, error: transitionError } = (await supabase
      .from('case_status_transitions')
      .select('*')
      .eq('from_status_id', currentCase.status_id)
      .eq('to_status_id', newStatus.id)
      .eq('required_role', user.role)
      .eq('is_active', true)
      .single()) || {};
    
    if (transitionError || !transition) {
      return res.status(403).json({
        success: false,
        error: `Status transition not allowed for role: ${user.role}`,
        currentStatus: currentCase.case_statuses.status_code,
        requestedStatus: newStatusCode,
      });
    }

    // Perform update
    const { error: updateError } = (await supabase
      .from('cases')
      .update({
        status_id: newStatus.id,
        status_changed_by: verifiedWallet,
        last_status_change: new Date().toISOString(),
      })
      .eq('id', safeId)) || {};
    
    if (updateError) throw updateError;

    // Log history
    await supabase.from('case_status_history').insert({
      case_id: safeId,
      from_status_id: currentCase.status_id,
      to_status_id: newStatus.id,
      changed_by: verifiedWallet,
      change_reason: reason || 'Status updated via API',
      metadata: {
        ...metadata,
        user_role: user.role,
        transition_name: transition.transition_name,
      },
    });

    await createStatusChangeNotification(safeId, currentCase.status_id, newStatus.id, verifiedWallet);

    await supabase.from('activity_logs').insert({
      user_wallet: verifiedWallet,
      action: 'case_status_change',
      details: JSON.stringify({
        case_id: safeId,
        from_status: currentCase.case_statuses.status_code,
        to_status: newStatusCode,
        reason,
      }),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Case status updated successfully',
      data: {
        newStatus: newStatusCode,
        caseId: safeId
      }
    });
  } catch (error) {
    console.error('Update case status error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to update case status' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get available status transitions for a case
const getAvailableTransitions = async (req, res) => {
  try {
    const { id } = req.params;
    const verifiedWallet = req.authenticatedWallet;

    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid case ID' });
    }

    const { data: user, error: userError } = (await supabase
      .from('users')
      .select('role')
      .eq('wallet_address', verifiedWallet)
      .single()) || {};
    
    if (userError || !user) return res.status(403).json({ success: false, error: 'User not found' });

    const { data: currentCase, error: caseError } = (await supabase
      .from('cases')
      .select('status_id')
      .eq('id', safeId)
      .single()) || {};
    
    if (caseError || !currentCase) return res.status(404).json({ success: false, error: 'Case not found' });

    const { data: transitions, error: transitionError } = (await supabase
      .from('case_status_transitions')
      .select(
        `*, to_status:case_statuses!case_status_transitions_to_status_id_fkey(status_code, status_name, color_code, icon)`,
      )
      .eq('from_status_id', currentCase.status_id)
      .eq('required_role', user.role)
      .eq('is_active', true)) || {};
    
    if (transitionError) throw transitionError;

    res.json({ success: true, data: transitions });
  } catch (error) {
    console.error('Get available transitions error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get transitions' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Assign user to case
const assignCase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assignToWallet,
      roleType,
      assignmentType = 'primary',
      notes,
    } = req.body;
    
    // SECURITY FIX: Use verified identity for 'assignedBy'
    const assignedByWallet = req.authenticatedWallet;
    if (!assignedByWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid case ID' });
    }

    // SECURITY FIX: Validate addresses
    const { validateWalletAddress } = require('../middleware/verifyAdmin');
    if (!validateWalletAddress(assignToWallet)) {
      return res.status(400).json({ success: false, error: 'Invalid assignee wallet address' });
    }

    const { data: assigner, error: assignerError } = (await supabase
      .from('users')
      .select('role')
      .eq('wallet_address', assignedByWallet)
      .single()) || {};
    
    if (
      assignerError ||
      !assigner ||
      !['admin', 'court_official', 'evidence_manager'].includes(assigner.role)
    ) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to assign cases' });
    }

    const { data: assignee, error: assigneeError } = (await supabase
      .from('users')
      .select('role, full_name')
      .eq('wallet_address', assignToWallet)
      .single()) || {};
    
    if (assigneeError || !assignee) return res.status(404).json({ success: false, error: 'Assignee not found' });

    // Mark previous assignments of this role as inactive
    await supabase
      .from('case_assignments')
      .update({ is_active: false, unassigned_at: new Date().toISOString() })
      .eq('case_id', safeId)
      .eq('role_type', roleType)
      .eq('assignment_type', assignmentType);

    // New assignment
    const { error: assignError } = (await supabase.from('case_assignments').insert({
      case_id: safeId,
      assigned_to: assignToWallet,
      assigned_by: assignedByWallet,
      role_type: roleType,
      assignment_type: assignmentType,
      notes: notes || '',
    })) || {};
    
    if (assignError) throw assignError;

    // Update case table summary fields
    const updateData = {};
    if (roleType === 'investigator') updateData.assigned_investigator = assignToWallet;
    if (roleType === 'legal_professional') updateData.assigned_prosecutor = assignToWallet;
    if (roleType === 'court_official') updateData.assigned_judge = assignToWallet;
    
    if (Object.keys(updateData).length > 0) {
      await supabase.from('cases').update(updateData).eq('id', safeId);
    }

    await createNotification(
      assignToWallet,
      'Case Assignment',
      `You have been assigned to case as ${roleType}`,
      'system',
      { case_id: safeId, role_type: roleType },
    );

    await supabase.from('activity_logs').insert({
      user_wallet: assignedByWallet,
      action: 'case_assignment',
      details: JSON.stringify({
        case_id: safeId,
        assigned_to: assignToWallet,
        role_type: roleType,
        assignee_name: assignee.full_name,
      }),
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Case assigned successfully' });
  } catch (error) {
    console.error('Assign case error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to assign case' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get case statistics by status
const getCaseStatistics = async (req, res) => {
  try {
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { timeframe = '30d' } = req.query;
    const now = new Date();
    let dateFilter = '';

    switch (timeframe) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1y':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: statusStats, error: statusError } = (await supabase
      .from('cases')
      .select(`status_id, case_statuses(status_code, status_name, color_code)`)
      .gte('created_date', dateFilter)) || {};
    
    if (statusError) throw statusError;

    const statusCounts = statusStats.reduce((acc, c) => {
      const s = c.case_statuses;
      if (!s) return acc;
      if (!acc[s.status_code]) acc[s.status_code] = { ...s, count: 0 };
      acc[s.status_code].count++;
      return acc;
    }, {});

    const { data: priorityStats, error: priorityError } = (await supabase
      .from('cases')
      .select('priority_level')
      .gte('created_date', dateFilter)) || {};
    
    if (priorityError) throw priorityError;

    const priorityCounts = priorityStats.reduce((acc, c) => {
      const p = c.priority_level || 3;
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    const { data: recentActivity, error: activityError } = (await supabase
      .from('case_status_history')
      .select(
        `*, cases(title, case_number), to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)`,
      )
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(10)) || {};
    
    if (activityError) throw activityError;

    res.json({
      success: true,
      data: {
        by_status: Object.values(statusCounts),
        by_priority: priorityCounts,
        recent_activity: recentActivity,
        timeframe,
      },
    });
  } catch (error) {
    console.error('Get case statistics error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get case statistics' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Export cases as CSV
const exportCases = async (req, res) => {
  try {
    const verifiedWallet = req.authenticatedWallet;
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { status, priority, assignedTo, caseType, jurisdiction, dateFrom, dateTo, search } =
      req.query;
    
    let query = supabase.from('cases').select(`*, case_statuses(status_name)`);

    if (status) query = query.eq('case_statuses.status_code', status);
    if (priority) query = query.eq('priority_level', priority);
    if (assignedTo)
      query = query.or(
        `assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`,
      );
    if (caseType) query = query.eq('case_type', caseType);
    if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
    if (dateFrom) query = query.gte('created_date', dateFrom);
    if (dateTo) query = query.lte('created_date', dateTo);
    
    if (search) {
      const sanitizedSearch = search.replace(/[%_.*(),'"]/g, '').trim();
      if (sanitizedSearch) {
        query = query.or(
          `title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,case_number.ilike.%${sanitizedSearch}%`,
        );
      }
    }

    const { data: cases, error } = await query.order('created_date', { ascending: false });
    if (error) throw error;

    const csvHeaders =
      'Case Number,Title,Status,Priority,Type,Jurisdiction,Created Date,Created By\n';
    const csvRows = cases
      .map(
        (c) =>
          `"${c.case_number || ''}","${c.title}","${c.case_statuses?.status_name || ''}","${c.priority_level || 3}","${c.case_type || ''}","${c.jurisdiction || ''}","${new Date(c.created_date).toLocaleDateString()}","${(c.created_by || '').substring(0, 8)}..."`,
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cases_export_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csvHeaders + csvRows);
  } catch (error) {
    console.error('Export cases error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to export cases' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

module.exports = {
  getCases,
  getCaseStatuses,
  getEnhancedCases,
  createCase,
  getCaseDetails,
  updateCaseStatus,
  getAvailableTransitions,
  assignCase,
  getCaseStatistics,
  exportCases,
};
