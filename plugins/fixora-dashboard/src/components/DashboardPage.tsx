import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Header,
  Content,
  ContentHeader,
  SupportButton,
  InfoCard,
} from '@backstage/core-components';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  makeStyles,
  CircularProgress,
  Chip,
  Divider,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import AppsIcon from '@material-ui/icons/Apps';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import GroupIcon from '@material-ui/icons/Group';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RefreshIcon from '@material-ui/icons/Refresh';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  statCard: {
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  },
  statCardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(3),
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  avatar: {
    width: 56,
    height: 56,
  },
  appRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 0),
  },
  appName: {
    fontWeight: 600,
  },
  appMeta: {
    color: theme.palette.text.secondary,
    fontSize: '0.85rem',
  },
  appActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  quickActionCard: {
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center',
    padding: theme.spacing(3),
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[6],
    },
  },
  quickActionIcon: {
    fontSize: 40,
    marginBottom: theme.spacing(1),
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
}

interface DashboardData {
  totalApplicationCount: number;
  activeApplicationCount: number;
  uniqueUserCount: number;
  registeredApplications: Application[];
}

const BASE_URL = 'http://localhost:8083/api';

function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}) {
  const classes = useStyles();
  return (
    <Card className={classes.statCard} onClick={onClick} elevation={3}>
      <CardContent className={classes.statCardContent}>
        <Box>
          <Typography className={classes.statValue}>{value}</Typography>
          <Typography className={classes.statLabel} variant="body2">
            {label}
          </Typography>
        </Box>
        <Avatar className={classes.avatar} style={{ backgroundColor: color }}>
          {icon}
        </Avatar>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/dashboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError('Could not connect to the backend API.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the user navigates to this page
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, location.pathname]);

  const apps = data?.registeredApplications ?? [];

  return (
    <Page themeId="home">
      <Header
        title="Fixora Dashboard"
        subtitle="Internal developer platform overview"
      />
      <Content>
        <ContentHeader title="Overview">
          <Tooltip title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}>
            <IconButton onClick={fetchDashboard} disabled={loading} size="small" style={{ marginRight: 8 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <SupportButton>
            Use this dashboard to monitor your applications and onboard new ones.
          </SupportButton>
        </ContentHeader>

        {/* Stat Cards */}
        <Grid container spacing={3} style={{ marginBottom: 24 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<AppsIcon />}
              label="Total Applications"
              value={loading ? '…' : data?.totalApplicationCount ?? 0}
              color="#3f51b5"
              onClick={() => navigate('/app-onboarding')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<CheckCircleIcon />}
              label="Active Applications"
              value={loading ? '…' : data?.activeApplicationCount ?? 0}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<GroupIcon />}
              label="Unique Users"
              value={loading ? '…' : data?.uniqueUserCount ?? 0}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<AddCircleOutlineIcon />}
              label="Onboard New App"
              value="+"
              color="#9c27b0"
              onClick={() => navigate('/app-onboarding')}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Registered Applications */}
          <Grid item xs={12} md={8}>
            <InfoCard title="Registered Applications" noPadding>
              {loading ? (
                <Box p={4} display="flex" justifyContent="center">
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box p={3}>
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : apps.length === 0 ? (
                <Box p={3}>
                  <Typography color="textSecondary">
                    No applications found. Start by onboarding one.
                  </Typography>
                </Box>
              ) : (
                <Box px={3}>
                  {apps.map((app, i) => (
                    <React.Fragment key={app.id}>
                      <Box className={classes.appRow}>
                        <Box>
                          <Typography className={classes.appName}>
                            {app.name}
                          </Typography>
                          <Typography className={classes.appMeta}>
                            {app.alias} · {app.ownerEmail}
                          </Typography>
                        </Box>
                        <Box className={classes.appActions}>
                          <Tooltip title="Configure Alerts">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/alerts/${app.id}`)}
                              style={{ color: '#ff9800' }}
                            >
                              <NotificationsIcon />
                            </IconButton>
                          </Tooltip>
                          <Chip
                            size="small"
                            label={app.status}
                            style={{
                              backgroundColor:
                                app.status === 'ACTIVE' ? '#e8f5e9' : '#fce4ec',
                              color:
                                app.status === 'ACTIVE' ? '#388e3c' : '#c62828',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Box>
                      {i < apps.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </InfoCard>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <InfoCard title="Quick Actions">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card
                    className={classes.quickActionCard}
                    elevation={2}
                    onClick={() => navigate('/app-onboarding')}
                  >
                    <AddCircleOutlineIcon
                      className={classes.quickActionIcon}
                      style={{ color: '#3f51b5' }}
                    />
                    <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                      Onboard Application
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Register a new service or application
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card
                    className={classes.quickActionCard}
                    elevation={2}
                    onClick={() => navigate('/app-onboarding?tab=lookup')}
                  >
                    <GroupIcon
                      className={classes.quickActionIcon}
                      style={{ color: '#ff9800' }}
                    />
                    <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                      Browse by AD Group
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Find applications by team / AD group
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
