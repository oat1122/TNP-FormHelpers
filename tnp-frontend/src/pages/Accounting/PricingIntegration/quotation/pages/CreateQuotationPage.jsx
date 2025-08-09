import { Box, Container, Grid } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { quotationTheme } from '../styles/theme.js';
import { ItemsEditor } from '../components/Items';
import { CustomerInfoCard } from '../components/Customer';
import { TotalsCard, PaymentTerms, NotesField } from '../components/Summary';
import { QuotationToolbar } from '../components/Toolbar';

export default function CreateQuotationPage(props) {
  const { formData, setFormData, numbers, actions } = props;

  return (
    <ThemeProvider theme={quotationTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="lg">
          <QuotationToolbar
            onBack={actions?.onBack}
            onPreview={actions?.onPreview}
            onDraft={actions?.onDraft}
            onSubmit={actions?.onSubmit}
            disabledSubmit={numbers?.total === 0 || actions?.isSubmitting}
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <CustomerInfoCard
                value={formData?.customer}
                onChange={(c) => setFormData?.((p) => ({ ...p, customer: c }))}
              />
              <ItemsEditor
                items={formData?.items}
                onChange={(items) => setFormData?.((p) => ({ ...p, items }))}
                numbers={numbers}
              />
              <NotesField
                value={formData?.notes}
                onChange={(v) => setFormData?.((p) => ({ ...p, notes: v }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
                <TotalsCard numbers={numbers} />
                <PaymentTerms value={formData} onChange={setFormData} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
