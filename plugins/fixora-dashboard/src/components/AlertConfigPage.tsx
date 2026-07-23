import React, { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Header,
  Content,
  ContentHeader,
  SupportButton,
  InfoCard,
  Progress,
} from '@backstage/core-components';
import {
  Grid,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Snackbar,
  makeStyles,
  Tabs,
  Tab,
  Box,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useParams, useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:8081/api';
const KEEP_UI_URL = 'http://localhost:3000';

const useStyles = makeStyles(theme => ({
  formField: {
    marginBottom: theme.spacing(2.5),
  },
  submitBtn: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1.2, 4),
    fontWeight: 700,
    borderRadius: 8,
  },
  tableHeader: {
    fontWeight: 700,
    backgroundColor: theme.palette.background.default,
  },
  tabPanel: {
    paddingTop: theme.spacing(3),
  },
  emptyMsg: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  actionBtn: {
    marginLeft: theme.spacing(0.5),
  },
  enabledChip: {
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    fontWeight: 600,
  },
  disabledChip: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    fontWeight: 600,
  },
}));

interface AlertConfig {
  id?: number;
  applicationId: number;
  serviceId?: number;
  owningAdGrp: string;
  name: string;
  description: string;
  alertType: string;
  severity: string;
  conditionExpression: string;
  environment: string;
  source: string;
  channels: string;
  goalertServiceUrl: string;
  teamsWebhookUrl: string;
  triggerAiInvestigation: boolean;
  enabled: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Application {
  id: number;
  name: string;
  alias: string;
  ownerEmail: string;
  adGroupMapping: string;
  description: string;
  status: string;
}

const EMPTY_ALERT: Omit<AlertConfig, 'applicationId'> = {
  name: '',
  description: '',
  owningAdGrp: '',
  serviceId: undefined,
  alertType: 'METRIC',
  severity: 'MEDIUM',
  conditionExpression: '',
  environment: 'production',
  source: '',
  channels: '',
  goalertServiceUrl: '',
  teamsWebhookUrl: '',
  triggerAiInvestigation: false,
  enabled: true,
};

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALERT_TYPE_OPTIONS = ['METRIC', 'LOG', 'EVENT', 'SYNTHETIC'];
const ENVIRONMENT_OPTIONS = ['production', 'staging', 'qa', 'development'];
const CHANNEL_OPTIONS = ['EMAIL', 'SLACK', 'TEAMS', 'PAGERDUTY', 'GOALERT', 'WEBHOOK'];

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return value === index ? <Box>{children}</Box> : null;
}

function AlertForm({
  applicationId,
  applicationName,
  userAdGroup,
  onSuccess,
  editingAlert,
  onCancel,
}: {
  applicationId: number;
  applicationName: string;
  userAdGroup: string;
  onSuccess: () => void;
  editingAlert?: AlertConfig | null;
  onCancel?: () => void;
}) {
  const classes = useStyles();
  const [form, setForm] = useState<AlertConfig>(
    editingAlert || { ...EMPTY_ALERT, applicationId }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAlert) {
      setForm(editingAlert);
    } else {
      setForm({ ...EMPTY_ALERT, applicationId });
    }
  }, [editingAlert, applicationId]);

  const handleChange = (field: keyof AlertConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: keyof AlertConfig) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const selectedChannels = form.channels ? form.channels.split(',').filter(Boolean) : [];

  const toggleChannel = (channel: string) => {
    const current = new Set(selectedChannels);
    if (current.has(channel)) {
      current.delete(channel);
    } else {
      current.add(channel);
    }
    setForm(prev => ({ ...prev, channels: Array.from(current).join(',') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = editingAlert
        ? `${BASE_URL}/applications/${applicationId}/alert-configurations/${editingAlert.id}`
        : `${BASE_URL}/applications/${applicationId}/alert-configurations`;
      const method = editingAlert ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-AD-Group': userAdGroup,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      onSuccess();
      if (!editingAlert) {
        setForm({ ...EMPTY_ALERT, applicationId });
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to save alert configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InfoCard title={editingAlert ? 'Edit Alert Configuration' : 'Create New Alert'}>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="Alert Name"
              placeholder="e.g. High CPU Alert"
              fullWidth
              required
              variant="outlined"
              value={form.name}
              onChange={handleChange('name')}
              disabled={submitting}
            />
            <TextField
              className={classes.formField}
              label="Application"
              fullWidth
              variant="outlined"
              value={applicationName}
              disabled
              helperText="Application is automatically set"
            />
            <TextField
              className={classes.formField}
              label="Owning AD Group"
              placeholder="e.g. dev-team"
              fullWidth
              required
              variant="outlined"
              value={form.owningAdGrp}
              onChange={handleChange('owningAdGrp')}
              disabled={submitting}
              helperText="AD group that owns this alert"
            />
            <TextField
              className={classes.formField}
              label="Service ID"
              placeholder="e.g. 1"
              type="number"
              fullWidth
              variant="outlined"
              value={form.serviceId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setForm(prev => ({ ...prev, serviceId: value }));
              }}
              disabled={submitting}
              helperText="Optional: Service ID for this alert"
            />
            <TextField
              className={classes.formField}
              label="Alert Type"
              fullWidth
              required
              select
              variant="outlined"
              value={form.alertType}
              onChange={handleChange('alertType')}
              disabled={submitting}
            >
              {ALERT_TYPE_OPTIONS.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              className={classes.formField}
              label="Environment"
              fullWidth
              required
              select
              variant="outlined"
              value={form.environment}
              onChange={handleChange('environment')}
              disabled={submitting}
            >
              {ENVIRONMENT_OPTIONS.map(env => (
                <MenuItem key={env} value={env}>
                  {env}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              className={classes.formField}
              label="Source"
              placeholder="e.g. prometheus, datadog, cloudwatch"
              fullWidth
              variant="outlined"
              value={form.source}
              onChange={handleChange('source')}
              disabled={submitting}
              helperText="System or monitoring tool that raises this alert"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="Severity"
              fullWidth
              required
              select
              variant="outlined"
              value={form.severity}
              onChange={handleChange('severity')}
              disabled={submitting}
            >
              {SEVERITY_OPTIONS.map(sev => (
                <MenuItem key={sev} value={sev}>
                  {sev}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              className={classes.formField}
              label="Condition Expression"
              placeholder="e.g. cpu_usage > 90"
              fullWidth
              required
              variant="outlined"
              value={form.conditionExpression}
              onChange={handleChange('conditionExpression')}
              disabled={submitting}
              helperText="Expression to trigger the alert"
            />
            <TextField
              className={classes.formField}
              label="Description"
              placeholder="Describe what this alert monitors"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={form.description}
              onChange={handleChange('description')}
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider style={{ margin: '8px 0 20px' }} />
            <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 8 }}>
              Notification Channels
            </Typography>
            <Box display="flex" flexWrap="wrap" gridGap={8} className={classes.formField}>
              {CHANNEL_OPTIONS.map(channel => (
                <Chip
                  key={channel}
                  label={channel}
                  clickable
                  disabled={submitting}
                  onClick={() => toggleChannel(channel)}
                  color={selectedChannels.includes(channel) ? 'primary' : 'default'}
                  variant={selectedChannels.includes(channel) ? 'default' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="GoAlert Service URL"
              placeholder="https://goalert.example.com/api/svc/..."
              fullWidth
              variant="outlined"
              value={form.goalertServiceUrl}
              onChange={handleChange('goalertServiceUrl')}
              disabled={submitting}
              helperText="GoAlert service integration endpoint"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="Teams Webhook URL"
              placeholder="https://outlook.office.com/webhook/..."
              fullWidth
              variant="outlined"
              value={form.teamsWebhookUrl}
              onChange={handleChange('teamsWebhookUrl')}
              disabled={submitting}
              helperText="Microsoft Teams incoming webhook"
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gridGap={24} className={classes.formField}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.triggerAiInvestigation}
                    onChange={handleSwitchChange('triggerAiInvestigation')}
                    color="primary"
                    disabled={submitting}
                  />
                }
                label="Trigger AI Investigation"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.enabled}
                    onChange={handleSwitchChange('enabled')}
                    color="primary"
                    disabled={submitting}
                  />
                }
                label="Enable Alert"
              />
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Box mb={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Box display="flex" alignItems="center" gridGap={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className={classes.submitBtn}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {submitting ? 'Saving…' : editingAlert ? 'Update Alert' : 'Create Alert'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outlined"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </Box>
      </form>
    </InfoCard>
  );
}

function AlertList({
  applicationId,
  userAdGroup,
  refreshTrigger,
  onEdit,
}: {
  applicationId: number;
  userAdGroup: string;
  refreshTrigger: number;
  onEdit: (alert: AlertConfig) => void;
}) {
  const classes = useStyles();
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<AlertConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/applications/${applicationId}/alert-configurations`, {
        headers: { 'X-AD-Group': userAdGroup },
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You do not belong to this application's configured AD group and cannot view its alerts.");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: AlertConfig[] = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load alerts. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, userAdGroup]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, refreshTrigger]);

  const handleDeleteClick = (alert: AlertConfig) => {
    setAlertToDelete(alert);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!alertToDelete?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/applications/${applicationId}/alert-configurations/${alertToDelete.id}`, {
        method: 'DELETE',
        headers: { 'X-AD-Group': userAdGroup },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDeleteDialogOpen(false);
      setAlertToDelete(null);
      fetchAlerts();
    } catch (err: any) {
      setError('Failed to delete alert.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (alerts.length === 0) {
    return (
      <Box className={classes.emptyMsg}>
        <Typography variant="h6" gutterBottom>
          No alerts configured
        </Typography>
        <Typography color="textSecondary">
          Create your first alert to get started with notifications.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Name',
                'Description',
                'Alert Type',
                'Severity',
                'Environment',
                'Channels',
                'AI Investigation',
                'Condition',
                'AD Group',
                'Status',
                'Actions',
              ].map(h => (
                <TableCell key={h} className={classes.tableHeader}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map(alert => (
              <TableRow key={alert.id} hover>
                <TableCell>
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    {alert.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {alert.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={alert.alertType} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={alert.severity}
                    style={{
                      backgroundColor:
                        alert.severity === 'CRITICAL'
                          ? '#ffebee'
                          : alert.severity === 'HIGH'
                          ? '#fff3e0'
                          : alert.severity === 'MEDIUM'
                          ? '#e3f2fd'
                          : '#f1f8e9',
                      color:
                        alert.severity === 'CRITICAL'
                          ? '#c62828'
                          : alert.severity === 'HIGH'
                          ? '#e65100'
                          : alert.severity === 'MEDIUM'
                          ? '#1565c0'
                          : '#388e3c',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    {alert.environment || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {alert.channels
                    ? alert.channels.split(',').filter(Boolean).map(ch => (
                        <Chip key={ch} size="small" label={ch} style={{ marginRight: 4, marginBottom: 4 }} />
                      ))
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={alert.triggerAiInvestigation ? 'Enabled' : 'Disabled'}
                    style={{
                      backgroundColor: alert.triggerAiInvestigation ? '#ede7f6' : '#f5f5f5',
                      color: alert.triggerAiInvestigation ? '#5e35b1' : '#757575',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {alert.conditionExpression}
                  </Typography>
                </TableCell>
                <TableCell>{alert.owningAdGrp}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={alert.enabled ? 'Enabled' : 'Disabled'}
                    className={
                      alert.enabled ? classes.enabledChip : classes.disabledChip
                    }
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(alert)}
                      className={classes.actionBtn}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(alert)}
                      className={classes.actionBtn}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the alert "{alertToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="secondary"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function AlertConfigPage() {
  const classes = useStyles();
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [success, setSuccess] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
  const [userAdGroup, setUserAdGroup] = useState<string>(
    () => localStorage.getItem('fixora_user_ad_group') || '',
  );
  const [groupInput, setGroupInput] = useState(userAdGroup);

  const fetchApplication = useCallback(async () => {
    if (!appId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/applications/${appId}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You do not have permission to access this application\'s alert configurations.');
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: Application = await res.json();
      setApplication(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleSuccess = () => {
    setSuccess(true);
    setRefreshTrigger(prev => prev + 1);
    setEditingAlert(null);
    setTab(0);
  };

  const handleEdit = (alert: AlertConfig) => {
    setEditingAlert(alert);
    setTab(1);
  };

  const handleSetGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupInput.trim();
    localStorage.setItem('fixora_user_ad_group', trimmed);
    setUserAdGroup(trimmed);
  };

  const allowedGroups = application
    ? application.adGroupMapping.split(',').map(g => g.trim()).filter(Boolean)
    : [];
  const isAuthorized = !!userAdGroup && allowedGroups.includes(userAdGroup.trim());

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Alert & Notifications" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="Alert & Notifications" />
        <Content>
          <Alert severity="error">{error}</Alert>
          <Box mt={2}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Box>
        </Content>
      </Page>
    );
  }

  if (!application) {
    return (
      <Page themeId="tool">
        <Header title="Alert & Notifications" />
        <Content>
          <Alert severity="warning">Application not found.</Alert>
        </Content>
      </Page>
    );
  }

  if (!userAdGroup || !isAuthorized) {
    return (
      <Page themeId="tool">
        <Header
          title={`Alert & Notifications - ${application.name}`}
          subtitle={`Manage alert configurations for ${application.alias}`}
        />
        <Content>
          <InfoCard title="Verify AD Group Membership">
            <Typography paragraph>
              Alert & Notification configurations for <strong>{application.name}</strong> are
              restricted to members of this application's configured AD group(s):{' '}
              <strong>{application.adGroupMapping}</strong>.
            </Typography>
            {userAdGroup && !isAuthorized && (
              <Box mb={2}>
                <Alert severity="error">
                  Your AD group "{userAdGroup}" is not authorized to view or modify alerts for this application.
                </Alert>
              </Box>
            )}
            <form onSubmit={handleSetGroup} noValidate>
              <Box display="flex" alignItems="flex-start" gridGap={12}>
                <TextField
                  label="Your AD Group"
                  placeholder="e.g. dev-team"
                  variant="outlined"
                  value={groupInput}
                  onChange={e => setGroupInput(e.target.value)}
                  required
                />
                <Button type="submit" variant="contained" color="primary" style={{ height: 56 }}>
                  Continue
                </Button>
              </Box>
            </form>
            <Box mt={2}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </Box>
          </InfoCard>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        title={`Alert & Notifications - ${application.name}`}
        subtitle={`Manage alert configurations for ${application.alias}`}
      />
      <Content>
        <ContentHeader title="Alert Management">
          <Button
            variant="outlined"
            color="primary"
            href={KEEP_UI_URL}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
            style={{ marginRight: 8 }}
          >
            Open Keep UI
          </Button>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              size="small"
              style={{ marginRight: 8 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Chip
            size="small"
            label={`AD Group: ${userAdGroup}`}
            onDelete={() => {
              localStorage.removeItem('fixora_user_ad_group');
              setUserAdGroup('');
              setGroupInput('');
            }}
            style={{ marginRight: 8 }}
          />
          <SupportButton>
            Configure alerts and notification channels for your application.
            Only users in the application's AD groups can modify these settings.
          </SupportButton>
        </ContentHeader>

        <Paper square elevation={0}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              if (v === 1) {
                setEditingAlert(null);
              }
            }}
            indicatorColor="primary"
            textColor="primary"
            style={{ marginBottom: 0 }}
          >
            <Tab label="Alert List" />
            <Tab label={editingAlert ? "Edit Alert" : "Create New Alert"} />
          </Tabs>
          <Divider />
        </Paper>

        <Box className={classes.tabPanel}>
          <TabPanel value={tab} index={0}>
            <InfoCard title="Configured Alerts" noPadding>
              <AlertList
                applicationId={Number(appId)}
                userAdGroup={userAdGroup}
                refreshTrigger={refreshTrigger}
                onEdit={handleEdit}
              />
            </InfoCard>
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <AlertForm
              applicationId={Number(appId)}
              applicationName={application.name}
              userAdGroup={userAdGroup}
              onSuccess={handleSuccess}
              editingAlert={editingAlert}
              onCancel={editingAlert ? () => { setEditingAlert(null); setTab(0); } : undefined}
            />
          </TabPanel>
        </Box>

        <Snackbar
          open={success}
          autoHideDuration={4000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(false)} severity="success">
            Alert configuration saved successfully!
          </Alert>
        </Snackbar>
      </Content>
    </Page>
  );
}
