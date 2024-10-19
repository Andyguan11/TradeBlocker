import React from 'react';
import Head from 'next/head';
import { Box, Container, Typography, Paper } from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Head>
        <title>ChartBlocker - Privacy Policy</title>
        <meta name="description" content="ChartBlocker Privacy Policy" />
      </Head>
      <Box sx={{ display: 'flex' }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                ChartBlocker Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Last updated: {new Date().toLocaleDateString()}
              </Typography>
              
              <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                1. Introduction
              </Typography>
              <Typography paragraph>
                ChartBlocker (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our ChartBlocker application and related services (collectively, the &quot;Service&quot;).
              </Typography>

              <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                2. Information We Collect
              </Typography>
              <Typography variant="h6" component="h3" gutterBottom>
                2.1 Personal Information
              </Typography>
              <Typography paragraph>
                We may collect personally identifiable information, such as:
              </Typography>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Brokerage account information (for connection purposes only)</li>
              </ul>

              <Typography variant="h6" component="h3" gutterBottom>
                2.2 Usage Data
              </Typography>
              <Typography paragraph>
                We may also collect information on how the Service is accessed and used, including:
              </Typography>
              <ul>
                <li>Login data</li>
                <li>Trading activity statistics</li>
                <li>Device information</li>
              </ul>

              {/* Continue with the rest of the sections... */}

              <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                9. Contact Us
              </Typography>
              <Typography paragraph>
                If you have any questions about this Privacy Policy, please contact us:
              </Typography>
              <Typography paragraph>
                By email: Andyguan681377@gmail.com
              </Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default PrivacyPolicy;
