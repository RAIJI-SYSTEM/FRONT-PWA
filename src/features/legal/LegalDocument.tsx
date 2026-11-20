import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalText {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

/** Documento legal (termos, privacidade): títulos numerados, parágrafos e listas */
export default function LegalDocument({ document }: { document: LegalText }) {
  return (
    <Stack component="article" spacing={3} sx={{ pt: 1 }}>
      <Box>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }}>
          {document.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Última atualização: {document.updatedAt}
        </Typography>
      </Box>
      <Typography>{document.intro}</Typography>
      {document.sections.map((section, index) => (
        <Box component="section" key={section.title}>
          <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {index + 1}. {section.title}
          </Typography>
          <Stack spacing={1}>
            {section.paragraphs?.map((p) => (
              <Typography key={p}>{p}</Typography>
            ))}
          </Stack>
          {section.items && (
            <Box component="ul" sx={{ pl: 3, my: 1, '& li': { mb: 0.75 } }}>
              {section.items.map((item) => (
                <Typography component="li" key={item}>
                  {item}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}
