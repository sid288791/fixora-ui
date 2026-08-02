import React, { useState, useEffect } from 'react';
import {
  Page,
  Header,
  Content,
  ContentHeader,
  SupportButton,
  InfoCard,
  Progress,
  ResponseErrorPanel,
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
  InputAdornment,
  IconButton,
  Paper,
  Tooltip,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:8083/api';

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
  statusChip: {
    fontWeight: 600,
  },
  searchBox: {
    marginBottom: theme.spacing(3),
  },
  tabPanel: {
    paddingTop: theme.spacing(3),
  },
  emptyMsg: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  successRow: {
    backgroundColor: '#f1f8e9',
  },
  copyBtn: {
    padding: 4,
    marginLeft: 4,
  },
  aliasHint: {
    fontSize: '0.78rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(-1.5),
    marginBottom: theme.spacing(2),
  },
}));

interface Application {
  id: number;
  name: string;
  alias: string;
  ownerEmail: string;
  adGroupMapping: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface OnboardForm {
  name: string;
  alias: string;
  ownerEmail: string;
  adGroupMapping: string;
  description: string;
}

const EMPTY_FORM: OnboardForm = {
  name: '',
  alias: '',
  ownerEmail: '',
  adGroupMapping: '',
  description: '',
};

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

function StatusChip({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <Chip
      size="small"
      label={status}
      style={{
        backgroundColor: isActive ? '#e8f5e9' : '#fff3e0',
        color: isActive ? '#388e3c' : '#e65100',
        fontWeight: 600,
      }}
    />
  );
}

function CopyableText({ text }: { text: string }) {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Box display="flex" alignItems="center">
      <span>{text}</span>
      <Tooltip title={copied ? 'Copied!' : 'Copy'}>
        <IconButton className={classes.copyBtn} size="small" onClick={handleCopy}>
          {copied ? (
            <CheckCircleIcon fontSize="small" style={{ color: '#4caf50' }} />
          ) : (
            <FileCopyIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function OnboardingForm() {
  const classes = useStyles();
  const [form, setForm] = useState<OnboardForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<OnboardForm>>({});

  const validate = (): boolean => {
    const errs: Partial<OnboardForm> = {};
    if (!form.name.trim()) errs.name = 'Application name is required';
    if (!form.alias.trim()) errs.alias = 'Alias is required';
    else if (!/^[a-z0-9-]+$/.test(form.alias))
      errs.alias = 'Alias must be lowercase alphanumeric with hyphens only';
    if (!form.ownerEmail.trim()) errs.ownerEmail = 'Owner email is required';
    else if (!/\S+@\S+\.\S+/.test(form.ownerEmail))
      errs.ownerEmail = 'Enter a valid email address';
    if (!form.adGroupMapping.trim())
      errs.adGroupMapping = 'At least one AD group is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof OnboardForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));

    // Auto-generate alias from name
    if (field === 'name') {
      const autoAlias = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setForm(prev => ({ ...prev, name: value, alias: autoAlias }));
    }

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/applications/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      setSuccess(true);
      setForm(EMPTY_FORM);
      setFieldErrors({});
    } catch (err: any) {
      setError(err.message ?? 'Failed to onboard application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InfoCard title="Onboard a New Application">
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="Application Name"
              placeholder="e.g. Payments Service"
              fullWidth
              required
              variant="outlined"
              value={form.name}
              onChange={handleChange('name')}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              disabled={submitting}
            />
            <TextField
              className={classes.formField}
              label="Alias"
              placeholder="e.g. payments-svc"
              fullWidth
              required
              variant="outlined"
              value={form.alias}
              onChange={handleChange('alias')}
              error={!!fieldErrors.alias}
              helperText={
                fieldErrors.alias ||
                'Lowercase letters, numbers and hyphens only. Auto-generated from name.'
              }
              disabled={submitting}
            />
            <TextField
              className={classes.formField}
              label="Owner Email"
              placeholder="e.g. team@example.com"
              fullWidth
              required
              type="email"
              variant="outlined"
              value={form.ownerEmail}
              onChange={handleChange('ownerEmail')}
              error={!!fieldErrors.ownerEmail}
              helperText={fieldErrors.ownerEmail}
              disabled={submitting}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              className={classes.formField}
              label="AD Group Mapping"
              placeholder="e.g. payments-team,finance-team"
              fullWidth
              required
              variant="outlined"
              value={form.adGroupMapping}
              onChange={handleChange('adGroupMapping')}
              error={!!fieldErrors.adGroupMapping}
              helperText={
                fieldErrors.adGroupMapping ||
                'Comma-separated list of AD group names'
              }
              disabled={submitting}
            />
            <TextField
              className={classes.formField}
              label="Description"
              placeholder="Briefly describe what this application does"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={form.description}
              onChange={handleChange('description')}
              disabled={submitting}
            />
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
            {submitting ? 'Submitting…' : 'Onboard Application'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={submitting}
            onClick={() => { setForm(EMPTY_FORM); setFieldErrors({}); setError(null); }}
          >
            Reset
          </Button>
        </Box>
      </form>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Application onboarded successfully!
        </Alert>
      </Snackbar>
    </InfoCard>
  );
}

function AdGroupLookup() {
  const classes = useStyles();
  const navigate = useNavigate();
  const [adGroup, setAdGroup] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const group = inputValue.trim();
    if (!group) return;
    setAdGroup(group);
    setLoading(true);
    setError(null);
    setSearched(true);
    setApps([]);

    try {
      const res = await fetch(
        `${BASE_URL}/applications/ad-group/${encodeURIComponent(group)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Application[] = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setInputValue('');
    setAdGroup('');
    setApps([]);
    setSearched(false);
    setError(null);
  };

  return (
    <InfoCard title="Browse Applications by AD Group">
      <Box className={classes.searchBox}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="AD Group Name"
              placeholder="e.g. dev-team"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                endAdornment: inputValue ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClear}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={loading || !inputValue.trim()}
              startIcon={<SearchIcon />}
              style={{ padding: '14px 24px', borderRadius: 8 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {loading && <Progress />}

      {error && <ResponseErrorPanel error={new Error(error)} />}

      {!loading && searched && !error && (
        <>
          <Typography variant="subtitle2" style={{ marginBottom: 12 }}>
            {apps.length === 0
              ? `No applications found for AD group "${adGroup}"`
              : `${apps.length} application(s) in AD group "${adGroup}"`}
          </Typography>

          {apps.length > 0 && (
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['ID', 'Name', 'Alias', 'Owner', 'AD Groups', 'Status', 'Created', 'Actions'].map(
                      h => (
                        <TableCell key={h} className={classes.tableHeader}>
                          {h}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apps.map(app => (
                    <TableRow key={app.id} hover>
                      <TableCell>{app.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" style={{ fontWeight: 600 }}>
                          {app.name}
                        </Typography>
                        {app.description && (
                          <Typography variant="caption" color="textSecondary">
                            {app.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <CopyableText text={app.alias} />
                      </TableCell>
                      <TableCell>{app.ownerEmail}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gridGap={4}>
                          {app.adGroupMapping.split(',').map(g => (
                            <Chip
                              key={g}
                              size="small"
                              label={g.trim()}
                              variant="outlined"
                              style={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={app.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Configure Alerts">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/alerts/${app.id}`)}
                            style={{ color: '#ff9800' }}
                          >
                            <NotificationsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {!searched && !loading && (
        <Box className={classes.emptyMsg}>
          <SearchIcon style={{ fontSize: 48, opacity: 0.3 }} />
          <Typography>Enter an AD group name to search for applications</Typography>
        </Box>
      )}
    </InfoCard>
  );
}

export function OnboardingPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'lookup' ? 1 : 0;
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setTab(p.get('tab') === 'lookup' ? 1 : 0);
  }, [location.search]);

  return (
    <Page themeId="tool">
      <Header
        title="Application Onboarding"
        subtitle="Register new applications and browse by AD group"
      />
      <Content>
        <ContentHeader title="Application Management">
          <SupportButton>
            Use the Onboard tab to register a new application. Use the Browse
            tab to lookup existing apps by their AD group mapping.
          </SupportButton>
        </ContentHeader>

        <Paper square elevation={0}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            indicatorColor="primary"
            textColor="primary"
            style={{ marginBottom: 0 }}
          >
            <Tab label="Onboard Application" />
            <Tab label="Browse by AD Group" />
          </Tabs>
          <Divider />
        </Paper>

        <Box className="tabPanel" style={{ paddingTop: 24 }}>
          <TabPanel value={tab} index={0}>
            <OnboardingForm />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <AdGroupLookup />
          </TabPanel>
        </Box>
      </Content>
    </Page>
  );
}
