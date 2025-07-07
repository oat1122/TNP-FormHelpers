import React from 'react';
import { Dialog } from '@mui/material';

const AuditDialog = ({ open, onClose, logs = [] }) => (
  <Dialog open={open} onClose={onClose}>
    <div className="p-4">
      <h2 className="text-xl mb-2">Audit Logs</h2>
      <ul>
        {logs.map((log) => (
          <li key={log.id}>{log.action} - {log.created_at}</li>
        ))}
      </ul>
    </div>
  </Dialog>
);

export default AuditDialog;
