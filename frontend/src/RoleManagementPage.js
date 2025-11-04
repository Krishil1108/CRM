import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import './RoleManagementPage.css';

function RoleManagementPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      modules: {},
      clients: {},
      inventory: {},
      quotation: {},
      meetings: {},
      notes: {},
      dashboard: {},
      settings: {}
    }
  });

  const permissionGroups = [
    {
      title: 'Module Access',
      key: 'modules',
      permissions: [
        { key: 'home', label: 'Home' },
        { key: 'clients', label: 'Clients' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'quotation', label: 'Quotation' },
        { key: 'quoteHistory', label: 'Quote History' },
        { key: 'settings', label: 'Settings' }
      ]
    },
    {
      title: 'Client Permissions',
      key: 'clients',
      permissions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
        { key: 'export', label: 'Export' },
        { key: 'import', label: 'Import' }
      ]
    },
    {
      title: 'Inventory Permissions',
      key: 'inventory',
      permissions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
        { key: 'manageStock', label: 'Manage Stock' },
        { key: 'export', label: 'Export' }
      ]
    },
    {
      title: 'Quotation Permissions',
      key: 'quotation',
      permissions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
        { key: 'generatePdf', label: 'Generate PDF' },
        { key: 'export', label: 'Export' }
      ]
    },
    {
      title: 'Meeting Permissions',
      key: 'meetings',
      permissions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' }
      ]
    },
    {
      title: 'Notes Permissions',
      key: 'notes',
      permissions: [
        { key: 'view', label: 'View' },
        { key: 'create', label: 'Create' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' }
      ]
    },
    {
      title: 'Dashboard Permissions',
      key: 'dashboard',
      permissions: [
        { key: 'viewAnalytics', label: 'View Analytics' },
        { key: 'viewReports', label: 'View Reports' },
        { key: 'exportReports', label: 'Export Reports' }
      ]
    },
    {
      title: 'Settings Permissions',
      key: 'settings',
      permissions: [
        { key: 'viewCompanySettings', label: 'View Company Settings' },
        { key: 'editCompanySettings', label: 'Edit Company Settings' },
        { key: 'manageUsers', label: 'Manage Users' },
        { key: 'manageRoles', label: 'Manage Roles' }
      ]
    }
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: {
          modules: {},
          clients: {},
          inventory: {},
          quotation: {},
          meetings: {},
          notes: {},
          dashboard: {},
          settings: {}
        }
      });
    }
    setShowModal(true);
  };

  const handlePermissionChange = (group, permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [group]: {
          ...prev.permissions[group],
          [permission]: !prev.permissions[group][permission]
        }
      }
    }));
  };

  const handleSelectAllInGroup = (group) => {
    const allPermissions = permissionGroups.find(g => g.key === group)?.permissions || [];
    const allSelected = allPermissions.every(p => formData.permissions[group][p.key]);
    
    const newGroupPermissions = {};
    allPermissions.forEach(p => {
      newGroupPermissions[p.key] = !allSelected;
    });

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [group]: newGroupPermissions
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingRole
      ? `http://localhost:5000/api/roles/${editingRole._id}`
      : 'http://localhost:5000/api/roles';

    const method = editingRole ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchRoles();
        setShowModal(false);
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchRoles();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="role-management-page">
      <div className="page-header">
        <h1>Role Management</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Role
        </button>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role._id} className="role-card">
            <div className="role-card-header">
              <h3>{role.name}</h3>
              {role.isSystemRole && <span className="system-badge">System</span>}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-actions">
              <button className="btn-edit" onClick={() => handleOpenModal(role)}>Edit</button>
              {!role.isSystemRole && (
                <button className="btn-danger" onClick={() => handleDelete(role._id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={editingRole?.isSystemRole}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="permissions-section">
                <h3>Permissions</h3>
                {permissionGroups.map(group => (
                  <div key={group.key} className="permission-group">
                    <div className="permission-group-header">
                      <h4>{group.title}</h4>
                      <button
                        type="button"
                        className="btn-select-all"
                        onClick={() => handleSelectAllInGroup(group.key)}
                      >
                        Toggle All
                      </button>
                    </div>
                    <div className="permission-checkboxes">
                      {group.permissions.map(perm => (
                        <label key={perm.key} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.permissions[group.key][perm.key] || false}
                            onChange={() => handlePermissionChange(group.key, perm.key)}
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagementPage;
